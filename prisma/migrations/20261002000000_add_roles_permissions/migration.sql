-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId")
);

-- AddColumn
ALTER TABLE "User" ADD COLUMN "roleId" TEXT;

-- Seed roles
INSERT INTO "Role" ("id", "code", "name", "description", "updatedAt") VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin', 'Administrator', 'Full access to the system', CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000002', 'user', 'User', 'Access to user read operations', CURRENT_TIMESTAMP);

-- Seed user CRUD permissions
INSERT INTO "Permission" ("id", "code", "name", "description", "updatedAt") VALUES
    ('00000000-0000-0000-0000-000000000101', 'users.read', 'Read users', 'View users', CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000102', 'users.create', 'Create users', 'Create users', CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000103', 'users.update', 'Update users', 'Update users', CURRENT_TIMESTAMP),
    ('00000000-0000-0000-0000-000000000104', 'users.delete', 'Delete users', 'Delete users', CURRENT_TIMESTAMP);

-- Existing users receive the basic user role
UPDATE "User"
SET "roleId" = '00000000-0000-0000-0000-000000000002'
WHERE "roleId" IS NULL;

-- Admin receives all user CRUD permissions; basic user can read users
INSERT INTO "RolePermission" ("roleId", "permissionId") VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000103'),
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000104'),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000101');

-- Make the relationship required after backfilling existing users
ALTER TABLE "User" ALTER COLUMN "roleId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_roleId_idx" ON "User"("roleId");
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
