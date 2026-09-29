import OpenAI, { toFile } from "openai";
import { Agent, OpenAIConversationsSession, run, codeInterpreterTool } from "@openai/agents";
import { z } from "zod";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const Chart = z.object({
  type: z.enum(["bar", "line"]),
  title: z.string(),
  labels: z.array(z.string()).max(40),
  values: z.array(z.number()).max(40),
  xLabel: z.string().optional(),
  yLabel: z.string().optional()
});

const Analysis = z.object({
  title: z.string(),
  answer: z.string(),
  keyFindings: z.array(z.string()).max(8),
  caveats: z.array(z.string()).max(8),
  charts: z.array(Chart).max(6),
  reportMarkdown: z.string()
});

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function progress(res, stage, message) {
  res.write(JSON.stringify({ type: "progress", stage, message }) + "\n");
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST required" });
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  try {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured on the server.");
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const question = String(body.question || "").trim();
    if (!question) throw new Error("A question is required.");

    let fileId = body.fileId || null;
    if (body.csvBase64) {
      progress(res, "upload", "Uploading the CSV securely to OpenAI…");
      const csv = Buffer.from(body.csvBase64, "base64");
      if (csv.length > 10 * 1024 * 1024) throw new Error("CSV is too large for this demo (10 MB maximum).");
      const filename = String(body.filename || "dataset.csv").replace(/[^a-zA-Z0-9._-]/g, "_");
      const uploaded = await client.files.create({
        file: await toFile(csv, filename, { type: "text/csv" }),
        purpose: "user_data"
      });
      fileId = uploaded.id;
    }
    if (!fileId) throw new Error("Upload a CSV first.");

    progress(res, "inspect", "Inspecting the dataset and planning the analysis…");

    const agent = new Agent({
      name: "Data Detective",
      model: "gpt-5.4",
      instructions: [
        "You are Data Detective, a rigorous CSV analysis agent.",
        "Use the Code Interpreter tool to inspect the supplied CSV and run Python analysis. Never invent values.",
        "Start by profiling rows, columns, missingness, data types and obvious anomalies.",
        "Then answer the user's question with reproducible calculations in Python.",
        "Create useful charts when the data supports them. Return compact bar or line chart specifications.",
        "Explain uncertainty, sampling limitations, missing data, correlation-vs-causation limits, and assumptions.",
        "Do not expose API keys or internal tool details.",
        "The reportMarkdown must be self-contained and include methods, findings, caveats, and chart descriptions."
      ].join("\n"),
      tools: [codeInterpreterTool({ container: { type: "auto", fileIds: [fileId] } })],
      outputType: Analysis
    });

    const session = new OpenAIConversationsSession(
      body.sessionId ? { conversationId: String(body.sessionId) } : undefined
    );

    progress(res, "compute", "Running Python analysis in the OpenAI-hosted sandbox…");
    const input = [
      "Dataset file ID: " + fileId,
      "User question: " + question,
      "Analyze the CSV directly with Python. Return the structured result only after the calculations are complete."
    ].join("\n");

    const stream = await run(agent, input, { stream: true, session });

    for await (const event of stream) {
      if (event.type === "run_item_stream_event") {
        if (event.name === "tool_called") progress(res, "compute", "Python analysis is running…");
        if (event.name === "tool_output") progress(res, "review", "Reviewing computed results and caveats…");
      }
    }
    await stream.completed;

    if (!stream.finalOutput) throw new Error("The agent did not produce a final analysis.");
    const sessionId = await session.getSessionId();
    progress(res, "report", "Preparing charts and the downloadable report…");
    res.write(JSON.stringify({
      type: "result",
      fileId,
      sessionId,
      analysis: stream.finalOutput
    }) + "\n");
    res.end();
  } catch (error) {
    res.write(JSON.stringify({ type: "error", error: error?.message || "Unexpected error" }) + "\n");
    res.end();
  }
}
