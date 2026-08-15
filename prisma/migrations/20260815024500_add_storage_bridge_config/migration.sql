CREATE TABLE "storage_bridge_config" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_bridge_config_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "storage_bridge_config" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE "storage_bridge_config" FROM anon;
REVOKE ALL ON TABLE "storage_bridge_config" FROM authenticated;
