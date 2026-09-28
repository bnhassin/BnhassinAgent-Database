import unittest

from agent.feature_registry import DEFAULT_FEATURES, Feature, FeatureRegistry


class FeatureRegistryTests(unittest.TestCase):
    def test_default_registry_contains_core_features(self):
        keys = [feature.key for feature in DEFAULT_FEATURES.list()]
        self.assertEqual(
            keys,
            ["agent/session", "docs/publish", "github/sync", "mcp/tools"],
        )

    def test_lookup_and_serialization(self):
        feature = DEFAULT_FEATURES.get("agent/session")
        self.assertIsNotNone(feature)
        self.assertEqual(feature.to_dict()["status"], "preview")

    def test_duplicate_keys_are_rejected(self):
        registry = FeatureRegistry()
        registry.register(Feature("demo", "Demo", "Demo feature"))
        with self.assertRaises(ValueError):
            registry.register(Feature("demo", "Demo 2", "Duplicate"))

    def test_invalid_key_is_rejected(self):
        with self.assertRaises(ValueError):
            Feature("/", "Invalid", "Invalid feature")


if __name__ == "__main__":
    unittest.main()
