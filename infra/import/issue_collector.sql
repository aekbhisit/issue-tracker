-- -------------------------------------------------------------
-- TablePlus 6.7.4(642)
--
-- https://tableplus.com/
--
-- Database: issue_collector
-- Generation Time: 2568-12-01 18:10:51.9800
-- -------------------------------------------------------------


DROP TABLE IF EXISTS "public"."_prisma_migrations";
-- Table Definition
CREATE TABLE "public"."_prisma_migrations" (
    "id" varchar(36) NOT NULL,
    "checksum" varchar(64) NOT NULL,
    "finished_at" timestamptz,
    "migration_name" varchar(255) NOT NULL,
    "logs" text,
    "rolled_back_at" timestamptz,
    "started_at" timestamptz NOT NULL DEFAULT now(),
    "applied_steps_count" int4 NOT NULL DEFAULT 0,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."seo";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS seo_id_seq;

-- Table Definition
CREATE TABLE "public"."seo" (
    "id" int4 NOT NULL DEFAULT nextval('seo_id_seq'::regclass),
    "module" text NOT NULL,
    "type" text,
    "data_id" int4 NOT NULL,
    "lang" text NOT NULL,
    "slug" text,
    "meta_title" text,
    "meta_description" text,
    "meta_keyword" text,
    "meta_image" text,
    "status" bool NOT NULL DEFAULT true,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."admin_menus";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS admin_menus_id_seq;

-- Table Definition
CREATE TABLE "public"."admin_menus" (
    "id" int4 NOT NULL DEFAULT nextval('admin_menus_id_seq'::regclass),
    "icon" text,
    "path" text,
    "parent_id" int4,
    "sequence" int4 NOT NULL DEFAULT 0,
    "module" text,
    "type" text,
    "required_group" text,
    "status" bool NOT NULL DEFAULT true,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."admin_menu_translate";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS admin_menu_translate_id_seq;

-- Table Definition
CREATE TABLE "public"."admin_menu_translate" (
    "id" int4 NOT NULL DEFAULT nextval('admin_menu_translate_id_seq'::regclass),
    "menu_id" int4 NOT NULL,
    "lang" text NOT NULL,
    "name" text,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."banners";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS banners_id_seq;

-- Table Definition
CREATE TABLE "public"."banners" (
    "id" int4 NOT NULL DEFAULT nextval('banners_id_seq'::regclass),
    "type" text,
    "style" text,
    "image" text,
    "mobile" text,
    "youtube" text,
    "video" text,
    "link" text,
    "target" bool NOT NULL DEFAULT false,
    "view" int4 NOT NULL DEFAULT 0,
    "section" text,
    "sequence" int4 NOT NULL DEFAULT 0,
    "status" bool NOT NULL DEFAULT true,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    "deleted_at" timestamp(3),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."banners_translate";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS banners_translate_id_seq;

-- Table Definition
CREATE TABLE "public"."banners_translate" (
    "id" int4 NOT NULL DEFAULT nextval('banners_translate_id_seq'::regclass),
    "banner_id" int4 NOT NULL,
    "lang" text NOT NULL,
    "name" text,
    "desc" text,
    "detail" text,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    "deleted_at" timestamp(3),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."contents";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS contents_id_seq;

-- Table Definition
CREATE TABLE "public"."contents" (
    "id" int4 NOT NULL DEFAULT nextval('contents_id_seq'::regclass),
    "type" text,
    "gallery" jsonb,
    "image" text,
    "video" text,
    "youtube" text,
    "file" text,
    "publish_at" timestamp(3),
    "start_at" timestamp(3),
    "end_at" timestamp(3),
    "start_time" text,
    "end_time" text,
    "link" text,
    "email" text,
    "phone" text,
    "view" int4 NOT NULL DEFAULT 0,
    "default" bool NOT NULL DEFAULT false,
    "parent_id" int4,
    "sequence" int4 NOT NULL DEFAULT 0,
    "status" bool NOT NULL DEFAULT true,
    "car_empty" text,
    "tenants" text,
    "color_code" text,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    "deleted_at" timestamp(3),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."content_translate";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS content_translate_id_seq;

-- Table Definition
CREATE TABLE "public"."content_translate" (
    "id" int4 NOT NULL DEFAULT nextval('content_translate_id_seq'::regclass),
    "content_id" int4 NOT NULL,
    "lang" text NOT NULL,
    "name" text,
    "desc" text,
    "detail" text,
    "text" text,
    "location" text,
    "prefix" text,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    "deleted_at" timestamp(3),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."content_and_categories";
-- Table Definition
CREATE TABLE "public"."content_and_categories" (
    "content_id" int4 NOT NULL,
    "category_id" int4 NOT NULL,
    PRIMARY KEY ("content_id","category_id")
);

DROP TABLE IF EXISTS "public"."content_categories";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS content_categories_id_seq;

-- Table Definition
CREATE TABLE "public"."content_categories" (
    "id" int4 NOT NULL DEFAULT nextval('content_categories_id_seq'::regclass),
    "type" text,
    "image" text,
    "gallery" jsonb,
    "video" text,
    "youtube" text,
    "file" text,
    "default" bool NOT NULL DEFAULT false,
    "parent_id" int4,
    "sequence" int4 NOT NULL DEFAULT 0,
    "status" bool NOT NULL DEFAULT true,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    "deleted_at" timestamp(3),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."content_view";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS content_view_id_seq;

-- Table Definition
CREATE TABLE "public"."content_view" (
    "id" int4 NOT NULL DEFAULT nextval('content_view_id_seq'::regclass),
    "type" text,
    "ip" text,
    "content_id" int4,
    "user_agent" text,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."content_category_translate";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS content_category_translate_id_seq;

-- Table Definition
CREATE TABLE "public"."content_category_translate" (
    "id" int4 NOT NULL DEFAULT nextval('content_category_translate_id_seq'::regclass),
    "category_id" int4 NOT NULL,
    "lang" text NOT NULL,
    "name" text,
    "desc" text,
    "detail" text,
    "text" text,
    "location" text,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    "deleted_at" timestamp(3),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."setting";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS setting_id_seq;

-- Table Definition
CREATE TABLE "public"."setting" (
    "id" int4 NOT NULL DEFAULT nextval('setting_id_seq'::regclass),
    "logo_header" text,
    "logo_footer" text,
    "right_click" bool NOT NULL DEFAULT false,
    "grayscale" bool NOT NULL DEFAULT false,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."languages";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS languages_id_seq;

-- Table Definition
CREATE TABLE "public"."languages" (
    "id" int4 NOT NULL DEFAULT nextval('languages_id_seq'::regclass),
    "setting_id" int4,
    "code" text NOT NULL,
    "name" text NOT NULL,
    "sequence" int4 NOT NULL DEFAULT 0,
    "default" bool NOT NULL DEFAULT false,
    "status" bool NOT NULL DEFAULT true,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."settings_translate";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS settings_translate_id_seq;

-- Table Definition
CREATE TABLE "public"."settings_translate" (
    "id" int4 NOT NULL DEFAULT nextval('settings_translate_id_seq'::regclass),
    "setting_id" int4 NOT NULL,
    "field" text NOT NULL,
    "value" text,
    "lang" text NOT NULL,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."user_roles";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS user_roles_id_seq;

-- Table Definition
CREATE TABLE "public"."user_roles" (
    "id" int4 NOT NULL DEFAULT nextval('user_roles_id_seq'::regclass),
    "name" text NOT NULL,
    "scope" text NOT NULL DEFAULT 'admin'::text,
    "sequence" int4 NOT NULL DEFAULT 0,
    "status" bool NOT NULL DEFAULT true,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."user_users";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS user_users_id_seq;

-- Table Definition
CREATE TABLE "public"."user_users" (
    "id" int4 NOT NULL DEFAULT nextval('user_users_id_seq'::regclass),
    "role_id" int4,
    "name" text,
    "username" text,
    "email" text,
    "password" text NOT NULL,
    "avatar" text,
    "lang" text NOT NULL DEFAULT 'en'::text,
    "login_at" timestamp(3),
    "status" bool NOT NULL DEFAULT false,
    "remember_token" text,
    "deleted_at" timestamp(3),
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."user_permissions";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS user_permissions_id_seq;

-- Table Definition
CREATE TABLE "public"."user_permissions" (
    "id" int4 NOT NULL DEFAULT nextval('user_permissions_id_seq'::regclass),
    "scope" text NOT NULL DEFAULT 'admin'::text,
    "method" text NOT NULL,
    "module" text NOT NULL,
    "type" text,
    "group" text NOT NULL,
    "action" text NOT NULL,
    "path" text NOT NULL,
    "meta_name" text NOT NULL,
    "description" text NOT NULL,
    "is_active" bool NOT NULL DEFAULT true,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."user_roles_permissions";
-- Table Definition
CREATE TABLE "public"."user_roles_permissions" (
    "role_id" int4 NOT NULL,
    "permission_id" int4 NOT NULL,
    PRIMARY KEY ("role_id","permission_id")
);

DROP TABLE IF EXISTS "public"."activity_logs";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS activity_logs_id_seq;
DROP TYPE IF EXISTS "public"."ActivityAction";
CREATE TYPE "public"."ActivityAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- Table Definition
CREATE TABLE "public"."activity_logs" (
    "id" int4 NOT NULL DEFAULT nextval('activity_logs_id_seq'::regclass),
    "user_id" int4,
    "action" "public"."ActivityAction" NOT NULL,
    "model" text NOT NULL,
    "model_id" text NOT NULL,
    "old_data" jsonb,
    "new_data" jsonb,
    "changes" jsonb,
    "ip_address" text,
    "user_agent" text,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."pages";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS pages_id_seq;

-- Table Definition
CREATE TABLE "public"."pages" (
    "id" int4 NOT NULL DEFAULT nextval('pages_id_seq'::regclass),
    "type" text NOT NULL,
    "gallery" jsonb,
    "image" text,
    "video" text,
    "youtube" text,
    "file" text,
    "publish_at" timestamp(3),
    "start_at" timestamp(3),
    "end_at" timestamp(3),
    "start_time" text,
    "end_time" text,
    "link" text,
    "email" text,
    "phone" text,
    "status" bool NOT NULL DEFAULT true,
    "default" bool NOT NULL DEFAULT false,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    "deleted_at" timestamp(3),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."page_translate";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS page_translate_id_seq;

-- Table Definition
CREATE TABLE "public"."page_translate" (
    "id" int4 NOT NULL DEFAULT nextval('page_translate_id_seq'::regclass),
    "page_id" int4 NOT NULL,
    "lang" text NOT NULL,
    "name" text,
    "desc" text,
    "detail" text,
    "text" text,
    "location" text,
    "prefix" text,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    "deleted_at" timestamp(3),
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."projects";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS projects_id_seq;

-- Table Definition
CREATE TABLE "public"."projects" (
    "id" int4 NOT NULL DEFAULT nextval('projects_id_seq'::regclass),
    "name" text NOT NULL,
    "description" text,
    "publicKey" text NOT NULL,
    "privateKey" text NOT NULL,
    "status" bool NOT NULL DEFAULT true,
    "allowedDomains" jsonb NOT NULL,
    "deleted_at" timestamp(3),
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."project_environments";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS project_environments_id_seq;

-- Table Definition
CREATE TABLE "public"."project_environments" (
    "id" int4 NOT NULL DEFAULT nextval('project_environments_id_seq'::regclass),
    "project_id" int4 NOT NULL,
    "name" text NOT NULL,
    "api_url" text,
    "allowed_origins" jsonb,
    "is_active" bool NOT NULL DEFAULT true,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."issues";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS issues_id_seq;

-- Table Definition
CREATE TABLE "public"."issues" (
    "id" int4 NOT NULL DEFAULT nextval('issues_id_seq'::regclass),
    "project_id" int4 NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "severity" text NOT NULL,
    "status" text NOT NULL DEFAULT 'open'::text,
    "assignee_id" int4,
    "reporter_info" jsonb,
    "metadata" jsonb,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."issue_screenshots";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS issue_screenshots_id_seq;

-- Table Definition
CREATE TABLE "public"."issue_screenshots" (
    "id" int4 NOT NULL DEFAULT nextval('issue_screenshots_id_seq'::regclass),
    "issue_id" int4 NOT NULL,
    "storage_path" text NOT NULL,
    "storage_type" text NOT NULL,
    "mime_type" text,
    "width" int4,
    "height" int4,
    "file_size" int4,
    "element_selector" jsonb,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."issue_logs";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS issue_logs_id_seq;

-- Table Definition
CREATE TABLE "public"."issue_logs" (
    "id" int4 NOT NULL DEFAULT nextval('issue_logs_id_seq'::regclass),
    "issue_id" int4 NOT NULL,
    "log_type" text NOT NULL,
    "level" text,
    "message" text NOT NULL,
    "stack" text,
    "metadata" jsonb,
    "timestamp" timestamp(3) NOT NULL,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

DROP TABLE IF EXISTS "public"."issue_comments";
-- Sequence and defined type
CREATE SEQUENCE IF NOT EXISTS issue_comments_id_seq;

-- Table Definition
CREATE TABLE "public"."issue_comments" (
    "id" int4 NOT NULL DEFAULT nextval('issue_comments_id_seq'::regclass),
    "issue_id" int4 NOT NULL,
    "user_id" int4 NOT NULL,
    "content" text NOT NULL,
    "created_at" timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp(3) NOT NULL,
    PRIMARY KEY ("id")
);

INSERT INTO "public"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") VALUES
('185ca4bd-b7fa-481a-88e7-1ef2ce1061ab', '3610d0b383c28aa6432bc5d0757238d10a7dc057dd8babb5196f84f8f41d7478', '2025-11-21 02:22:38.797931+00', '20251112080907_dev', NULL, NULL, '2025-11-21 02:22:38.641513+00', 1),
('93d86667-5dd2-4387-a988-2c4033ee9099', '5a3e1552890a5cc0fdcf4a3e7fe58e60f861d7904c362ae3e7bf9f99d26a6586', '2025-11-21 02:22:38.825979+00', '20251119040514_page_and_activity', NULL, NULL, '2025-11-21 02:22:38.799232+00', 1),
('d83bc3f3-21b1-4913-b349-433b05c083d4', '5f0c64b68e29f477e91e1b063496c4766458f5a3810090a03edb897126b651cd', '2025-11-25 06:21:12.695494+00', '20250120000000_add_element_selector', '', NULL, '2025-11-25 06:21:12.695494+00', 0);

INSERT INTO "public"."setting" ("id", "logo_header", "logo_footer", "right_click", "grayscale", "created_at", "updated_at") VALUES
(1, NULL, NULL, 'f', 'f', '2025-11-21 02:23:45.047', '2025-11-21 02:23:45.047');

INSERT INTO "public"."languages" ("id", "setting_id", "code", "name", "sequence", "default", "status", "created_at", "updated_at") VALUES
(1, 1, 'th', 'ไทย', 1, 't', 't', '2025-11-21 02:23:45.196', '2025-11-21 02:23:45.196'),
(2, 1, 'en', 'English', 2, 'f', 't', '2025-11-21 02:23:45.208', '2025-11-21 02:23:45.208');

INSERT INTO "public"."user_roles" ("id", "name", "scope", "sequence", "status", "created_at", "updated_at") VALUES
(1, 'Super Admin', 'admin', 0, 't', '2025-11-21 02:23:45.254', '2025-11-21 02:23:45.254');

INSERT INTO "public"."user_users" ("id", "role_id", "name", "username", "email", "password", "avatar", "lang", "login_at", "status", "remember_token", "deleted_at", "created_at", "updated_at") VALUES
(1, 1, 'Super Admin', 'admin', 'admin@admin.com', '$2a$10$jzy0vbKPFf6cSLTqay.QFuiugcGJP73.ikyJGf4V1WMRRCdo8bQEm', NULL, 'en', '2025-11-25 07:29:17.909', 't', NULL, NULL, '2025-11-21 02:23:45.274', '2025-11-25 07:29:17.91');

INSERT INTO "public"."user_permissions" ("id", "scope", "method", "module", "type", "group", "action", "path", "meta_name", "description", "is_active", "created_at", "updated_at") VALUES
(1, 'admin', 'GET', 'user', 'default', 'view', 'get_data', '/api/admin/v1/user', 'user.default.view.get_data', 'default get_data', 't', '2025-11-21 02:23:45.216', '2025-11-21 02:23:45.216'),
(2, 'admin', 'GET', 'user', 'default', 'view', 'get_detail', '/api/admin/v1/user/:id', 'user.default.view.get_detail', 'default get_detail', 't', '2025-11-21 02:23:45.219', '2025-11-21 02:23:45.219'),
(3, 'admin', 'POST', 'user', 'default', 'add', 'add_data', '/api/admin/v1/user', 'user.default.add.add_data', 'default add_data', 't', '2025-11-21 02:23:45.222', '2025-11-21 02:23:45.222'),
(4, 'admin', 'PUT', 'user', 'default', 'edit', 'edit_data', '/api/admin/v1/user/:id', 'user.default.edit.edit_data', 'default edit_data', 't', '2025-11-21 02:23:45.223', '2025-11-21 02:23:45.223'),
(5, 'admin', 'PATCH', 'user', 'default', 'edit', 'update_status', '/api/admin/v1/user/:id/status', 'user.default.edit.update_status', 'default update_status', 't', '2025-11-21 02:23:45.224', '2025-11-21 02:23:45.224'),
(6, 'admin', 'DELETE', 'user', 'default', 'delete', 'delete_data', '/api/admin/v1/user/:id', 'user.default.delete.delete_data', 'default delete_data', 't', '2025-11-21 02:23:45.225', '2025-11-21 02:23:45.225'),
(7, 'admin', 'PATCH', 'user', 'default', 'edit', 'update_role', '/api/admin/v1/user/:id/role', 'user.default.edit.update_role', 'default update_role', 't', '2025-11-21 02:23:45.226', '2025-11-21 02:23:45.226'),
(8, 'admin', 'GET', 'role', 'default', 'view', 'get_list', '/api/admin/v1/role/list', 'role.default.view.get_list', 'default get_list', 't', '2025-11-21 02:23:45.227', '2025-11-21 02:23:45.227'),
(9, 'admin', 'GET', 'role', 'default', 'view', 'get_data', '/api/admin/v1/role', 'role.default.view.get_data', 'default get_data', 't', '2025-11-21 02:23:45.228', '2025-11-21 02:23:45.228'),
(10, 'admin', 'GET', 'role', 'default', 'view', 'get_detail', '/api/admin/v1/role/:id', 'role.default.view.get_detail', 'default get_detail', 't', '2025-11-21 02:23:45.228', '2025-11-21 02:23:45.228'),
(11, 'admin', 'POST', 'role', 'default', 'add', 'add_data', '/api/admin/v1/role', 'role.default.add.add_data', 'default add_data', 't', '2025-11-21 02:23:45.229', '2025-11-21 02:23:45.229'),
(12, 'admin', 'PUT', 'role', 'default', 'edit', 'edit_data', '/api/admin/v1/role/:id', 'role.default.edit.edit_data', 'default edit_data', 't', '2025-11-21 02:23:45.23', '2025-11-21 02:23:45.23'),
(13, 'admin', 'PATCH', 'role', 'default', 'edit', 'update_status', '/api/admin/v1/role/:id/status', 'role.default.edit.update_status', 'default update_status', 't', '2025-11-21 02:23:45.231', '2025-11-21 02:23:45.231'),
(14, 'admin', 'POST', 'role', 'default', 'edit', 'update_sequence', '/api/admin/v1/role/:id/sort', 'role.default.edit.update_sequence', 'default update_sequence', 't', '2025-11-21 02:23:45.232', '2025-11-21 02:23:45.232'),
(15, 'admin', 'DELETE', 'role', 'default', 'delete', 'delete_data', '/api/admin/v1/role/:id', 'role.default.delete.delete_data', 'default delete_data', 't', '2025-11-21 02:23:45.232', '2025-11-21 02:23:45.232'),
(16, 'admin', 'GET', 'permission', 'default', 'view', 'get_modules', '/api/admin/v1/permission/modules', 'permission.default.view.get_modules', 'default get_modules', 't', '2025-11-21 02:23:45.233', '2025-11-21 02:23:45.233'),
(17, 'admin', 'GET', 'permission', 'default', 'view', 'get_data', '/api/admin/v1/permission/grouped', 'permission.default.view.get_data', 'default get_data', 't', '2025-11-21 02:23:45.234', '2025-11-21 02:23:45.234'),
(18, 'admin', 'GET', 'permission', 'default', 'view', 'get_detail', '/api/admin/v1/permission/:id', 'permission.default.view.get_detail', 'default get_detail', 't', '2025-11-21 02:23:45.235', '2025-11-21 02:23:45.235'),
(19, 'admin', 'POST', 'permission', 'default', 'add', 'add_data', '/api/admin/v1/permission', 'permission.default.add.add_data', 'default add_data', 't', '2025-11-21 02:23:45.236', '2025-11-21 02:23:45.236'),
(20, 'admin', 'PUT', 'permission', 'default', 'edit', 'edit_data', '/api/admin/v1/permission/:id', 'permission.default.edit.edit_data', 'default edit_data', 't', '2025-11-21 02:23:45.238', '2025-11-21 02:23:45.238'),
(21, 'admin', 'PATCH', 'permission', 'default', 'edit', 'update_status', '/api/admin/v1/permission/:id/status', 'permission.default.edit.update_status', 'default update_status', 't', '2025-11-21 02:23:45.241', '2025-11-21 02:23:45.241'),
(22, 'admin', 'DELETE', 'permission', 'default', 'delete', 'delete_data', '/api/admin/v1/permission/:id', 'permission.default.delete.delete_data', 'default delete_data', 't', '2025-11-21 02:23:45.242', '2025-11-21 02:23:45.242'),
(23, 'admin', 'GET', 'admin_menu', 'default', 'view', 'get_menu', '/api/admin/v1/admin-menu', 'admin_menu.default.view.get_menu', 'default get_menu', 't', '2025-11-21 02:23:45.243', '2025-11-21 02:23:45.243'),
(24, 'admin', 'GET', 'admin_menu', 'default', 'view', 'get_data', '/api/admin/v1/admin-menu/all', 'admin_menu.default.view.get_data', 'default get_data', 't', '2025-11-21 02:23:45.244', '2025-11-21 02:23:45.244'),
(25, 'admin', 'GET', 'admin_menu', 'default', 'view', 'get_modules', '/api/admin/v1/admin-menu/modules', 'admin_menu.default.view.get_modules', 'default get_modules', 't', '2025-11-21 02:23:45.245', '2025-11-21 02:23:45.245'),
(26, 'admin', 'PUT', 'admin_menu', 'default', 'edit', 'update_sequence', '/api/admin/v1/admin-menu/tree/reorder', 'admin_menu.default.edit.update_sequence', 'default update_sequence', 't', '2025-11-21 02:23:45.246', '2025-11-21 02:23:45.246'),
(27, 'admin', 'GET', 'admin_menu', 'default', 'view', 'get_types', '/api/admin/v1/admin-menu/types/:module', 'admin_menu.default.view.get_types', 'default get_types', 't', '2025-11-21 02:23:45.246', '2025-11-21 02:23:45.246'),
(28, 'admin', 'GET', 'admin_menu', 'default', 'view', 'get_detail', '/api/admin/v1/admin-menu/:id', 'admin_menu.default.view.get_detail', 'default get_detail', 't', '2025-11-21 02:23:45.247', '2025-11-21 02:23:45.247'),
(29, 'admin', 'POST', 'admin_menu', 'default', 'add', 'add_data', '/api/admin/v1/admin-menu', 'admin_menu.default.add.add_data', 'default add_data', 't', '2025-11-21 02:23:45.248', '2025-11-21 02:23:45.248'),
(30, 'admin', 'PUT', 'admin_menu', 'default', 'edit', 'edit_data', '/api/admin/v1/admin-menu/:id', 'admin_menu.default.edit.edit_data', 'default edit_data', 't', '2025-11-21 02:23:45.249', '2025-11-21 02:23:45.249'),
(31, 'admin', 'DELETE', 'admin_menu', 'default', 'delete', 'delete_data', '/api/admin/v1/admin-menu/:id', 'admin_menu.default.delete.delete_data', 'default delete_data', 't', '2025-11-21 02:23:45.25', '2025-11-21 02:23:45.25');

INSERT INTO "public"."user_roles_permissions" ("role_id", "permission_id") VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 8),
(1, 9),
(1, 10),
(1, 11),
(1, 12),
(1, 13),
(1, 14),
(1, 15),
(1, 16),
(1, 17),
(1, 18),
(1, 19),
(1, 20),
(1, 21),
(1, 22),
(1, 23),
(1, 24),
(1, 25),
(1, 26),
(1, 27),
(1, 28),
(1, 29),
(1, 30),
(1, 31);

INSERT INTO "public"."activity_logs" ("id", "user_id", "action", "model", "model_id", "old_data", "new_data", "changes", "ip_address", "user_agent", "created_at") VALUES
(1, 1, 'CREATE', 'Project', '1', NULL, '{"id": 1, "name": "Test Project 1", "status": true, "createdAt": {}, "deletedAt": null, "publicKey": "proj_v36BCCSdM_4wm9pp", "updatedAt": {}, "privateKey": "proj_hJoDdlvaNhw-Kz6X", "description": null, "environments": [], "allowedDomains": ["example.com"]}', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-21 03:14:54.51'),
(2, 1, 'UPDATE', 'Project', '1', '{"id": 1, "name": "Test Project 1", "status": true, "createdAt": {}, "deletedAt": null, "publicKey": "proj_v36BCCSdM_4wm9pp", "updatedAt": {}, "privateKey": "proj_hJoDdlvaNhw-Kz6X", "description": null, "environments": [], "allowedDomains": ["example.com"]}', '{"id": 1, "name": "Test Project 1", "status": true, "createdAt": {}, "deletedAt": null, "publicKey": "proj_v36BCCSdM_4wm9pp", "updatedAt": {}, "privateKey": "proj_hJoDdlvaNhw-Kz6X", "description": "Updated description for browser testing", "environments": [], "allowedDomains": ["example.com"]}', '{"description": {"new": "Updated description for browser testing", "old": null}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-21 03:16:07.704'),
(3, 1, 'UPDATE', 'Project', '1', '{"id": 1, "name": "Test Project 1", "status": true, "createdAt": {}, "deletedAt": null, "publicKey": "proj_v36BCCSdM_4wm9pp", "updatedAt": {}, "privateKey": "proj_hJoDdlvaNhw-Kz6X", "description": "Updated description for browser testing", "environments": [], "allowedDomains": ["example.com"]}', '{"id": 1, "name": "Test Project 1", "status": false, "createdAt": {}, "deletedAt": null, "publicKey": "proj_v36BCCSdM_4wm9pp", "updatedAt": {}, "privateKey": "proj_hJoDdlvaNhw-Kz6X", "description": "Updated description for browser testing", "environments": [], "allowedDomains": ["example.com"]}', '{"status": {"new": false, "old": true}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-21 03:16:34.853'),
(4, 1, 'DELETE', 'Project', '1', '{"id": 1, "name": "Test Project 1", "status": false, "createdAt": {}, "deletedAt": null, "publicKey": "proj_v36BCCSdM_4wm9pp", "updatedAt": {}, "privateKey": "proj_hJoDdlvaNhw-Kz6X", "description": "Updated description for browser testing", "allowedDomains": ["example.com"]}', NULL, NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', '2025-11-21 03:19:56.992'),
(5, 1, 'CREATE', 'Project', '2', NULL, '{"id": 2, "name": "testt", "status": true, "createdAt": {}, "deletedAt": null, "publicKey": "proj_YeCKPYTJ9Olcp4UQ", "updatedAt": {}, "privateKey": "proj_-FfatUMmJhlwrEsl", "description": "est", "environments": [], "allowedDomains": ["example.com"]}', NULL, '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/2.0.77 Chrome/138.0.7204.251 Electron/37.7.0 Safari/537.36', '2025-11-21 03:50:36.623'),
(6, 1, 'UPDATE', 'Project', '2', '{"id": 2, "name": "testt", "status": true, "createdAt": {}, "deletedAt": null, "publicKey": "proj_YeCKPYTJ9Olcp4UQ", "updatedAt": {}, "privateKey": "proj_-FfatUMmJhlwrEsl", "description": "est", "environments": [], "allowedDomains": ["example.com"]}', '{"id": 2, "name": "testt", "status": false, "createdAt": {}, "deletedAt": null, "publicKey": "proj_YeCKPYTJ9Olcp4UQ", "updatedAt": {}, "privateKey": "proj_-FfatUMmJhlwrEsl", "description": "est", "environments": [], "allowedDomains": ["example.com"]}', '{"status": {"new": false, "old": true}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/2.0.77 Chrome/138.0.7204.251 Electron/37.7.0 Safari/537.36', '2025-11-21 04:06:55.25'),
(7, 1, 'UPDATE', 'Project', '2', '{"id": 2, "name": "testt", "status": false, "createdAt": {}, "deletedAt": null, "publicKey": "proj_YeCKPYTJ9Olcp4UQ", "updatedAt": {}, "privateKey": "proj_-FfatUMmJhlwrEsl", "description": "est", "environments": [], "allowedDomains": ["example.com"]}', '{"id": 2, "name": "testt", "status": true, "createdAt": {}, "deletedAt": null, "publicKey": "proj_YeCKPYTJ9Olcp4UQ", "updatedAt": {}, "privateKey": "proj_-FfatUMmJhlwrEsl", "description": "est", "environments": [], "allowedDomains": ["example.com"]}', '{"status": {"new": true, "old": false}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/2.0.77 Chrome/138.0.7204.251 Electron/37.7.0 Safari/537.36', '2025-11-21 04:06:56.723'),
(8, 1, 'UPDATE', 'Project', '2', '{"id": 2, "name": "testt", "status": true, "createdAt": {}, "deletedAt": null, "publicKey": "proj_YeCKPYTJ9Olcp4UQ", "updatedAt": {}, "privateKey": "proj_-FfatUMmJhlwrEsl", "description": "est", "environments": [], "allowedDomains": ["example.com"]}', '{"id": 2, "name": "testt", "status": false, "createdAt": {}, "deletedAt": null, "publicKey": "proj_YeCKPYTJ9Olcp4UQ", "updatedAt": {}, "privateKey": "proj_-FfatUMmJhlwrEsl", "description": "est", "environments": [], "allowedDomains": ["example.com"]}', '{"status": {"new": false, "old": true}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/2.0.77 Chrome/138.0.7204.251 Electron/37.7.0 Safari/537.36', '2025-11-21 04:06:57.497'),
(9, 1, 'UPDATE', 'Project', '2', '{"id": 2, "name": "testt", "status": false, "createdAt": {}, "deletedAt": null, "publicKey": "proj_YeCKPYTJ9Olcp4UQ", "updatedAt": {}, "privateKey": "proj_-FfatUMmJhlwrEsl", "description": "est", "environments": [], "allowedDomains": ["example.com"]}', '{"id": 2, "name": "testt", "status": true, "createdAt": {}, "deletedAt": null, "publicKey": "proj_YeCKPYTJ9Olcp4UQ", "updatedAt": {}, "privateKey": "proj_-FfatUMmJhlwrEsl", "description": "est", "environments": [], "allowedDomains": ["example.com"]}', '{"status": {"new": true, "old": false}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Cursor/2.0.77 Chrome/138.0.7204.251 Electron/37.7.0 Safari/537.36', '2025-11-21 04:14:38.015');

INSERT INTO "public"."projects" ("id", "name", "description", "publicKey", "privateKey", "status", "allowedDomains", "deleted_at", "created_at", "updated_at") VALUES
(1, 'Test Project 1', 'Updated description for browser testing', 'proj_v36BCCSdM_4wm9pp', 'proj_hJoDdlvaNhw-Kz6X', 'f', '["example.com"]', '2025-11-21 03:19:56.971', '2025-11-21 03:14:54.479', '2025-11-21 03:19:56.972'),
(2, 'testt', 'est', 'proj_YeCKPYTJ9Olcp4UQ', 'proj_-FfatUMmJhlwrEsl', 't', '["example.com"]', NULL, '2025-11-21 03:50:36.589', '2025-11-21 04:14:37.987');

INSERT INTO "public"."issues" ("id", "project_id", "title", "description", "severity", "status", "assignee_id", "reporter_info", "metadata", "created_at", "updated_at") VALUES
(1, 2, 'IC-5 Test Issue - Basic', 'Updated description from IC-5 test script', 'medium', 'in-progress', NULL, NULL, '{"url": "https://example.com/test", "screen": {"width": 1920, "height": 1080}, "language": "en-US", "timezone": "America/New_York", "viewport": {"width": 1920, "height": 1080}, "timestamp": "2025-11-21T08:48:21.000Z", "userAgent": "Mozilla/5.0 (IC-5 Test Script)"}', '2025-11-21 08:48:22.033', '2025-11-21 08:49:02.539'),
(2, 2, 'IC-5 Test Issue - With Screenshot', 'This issue includes a screenshot', 'high', 'open', NULL, NULL, '{"url": "https://example.com/test-screenshot", "screen": {"width": 1920, "height": 1080}, "language": "en-US", "timezone": "America/New_York", "viewport": {"width": 1920, "height": 1080}, "timestamp": "2025-11-21T08:48:22.000Z", "userAgent": "Mozilla/5.0 (IC-5 Test Script)"}', '2025-11-21 08:48:22.101', '2025-11-21 08:48:22.101'),
(3, 2, 'IC-5 Test Issue - With Logs', 'This issue includes console logs, errors, and network errors', 'medium', 'open', NULL, NULL, '{"url": "https://example.com/test-logs", "screen": {"width": 1920, "height": 1080}, "language": "en-US", "timezone": "America/New_York", "viewport": {"width": 1920, "height": 1080}, "timestamp": "2025-11-21T08:48:22.000Z", "userAgent": "Mozilla/5.0 (IC-5 Test Script)"}', '2025-11-21 08:48:22.157', '2025-11-21 08:48:22.157'),
(4, 2, 'IC-5 Storage Test - Screenshot', 'Testing screenshot storage', 'high', 'open', NULL, NULL, '{"url": "https://example.com/storage-test", "screen": {"width": 1920, "height": 1080}, "language": "en-US", "timezone": "America/New_York", "viewport": {"width": 1920, "height": 1080}, "timestamp": "2025-11-21T08:49:03.000Z", "userAgent": "Mozilla/5.0 (IC-5 Storage Test)"}', '2025-11-21 08:49:03.977', '2025-11-21 08:49:03.977'),
(5, 2, 'IC-5 Integration Test Issue', 'End-to-end integration test', 'high', 'in-progress', NULL, NULL, '{"url": "https://example.com/integration-test", "screen": {"width": 1920, "height": 1080}, "language": "en-US", "timezone": "America/New_York", "viewport": {"width": 1920, "height": 1080}, "timestamp": "2025-11-21T08:49:05.000Z", "userAgent": "Mozilla/5.0 (IC-5 Integration Test)"}', '2025-11-21 08:49:05.581', '2025-11-21 08:49:05.653'),
(6, 2, 'IC-5 Test Issue - Basic', 'Updated description from IC-5 test script', 'medium', 'in-progress', NULL, NULL, '{"url": "https://example.com/test", "screen": {"width": 1920, "height": 1080}, "language": "en-US", "timezone": "America/New_York", "viewport": {"width": 1920, "height": 1080}, "timestamp": "2025-11-21T08:52:01.000Z", "userAgent": "Mozilla/5.0 (IC-5 Test Script)"}', '2025-11-21 08:52:02.128', '2025-11-21 08:52:04.217'),
(7, 2, 'IC-5 Test Issue - With Screenshot', 'This issue includes a screenshot', 'high', 'open', NULL, NULL, '{"url": "https://example.com/test-screenshot", "screen": {"width": 1920, "height": 1080}, "language": "en-US", "timezone": "America/New_York", "viewport": {"width": 1920, "height": 1080}, "timestamp": "2025-11-21T08:52:02.000Z", "userAgent": "Mozilla/5.0 (IC-5 Test Script)"}', '2025-11-21 08:52:02.208', '2025-11-21 08:52:02.208'),
(8, 2, 'IC-5 Test Issue - With Logs', 'This issue includes console logs, errors, and network errors', 'medium', 'open', NULL, NULL, '{"url": "https://example.com/test-logs", "screen": {"width": 1920, "height": 1080}, "language": "en-US", "timezone": "America/New_York", "viewport": {"width": 1920, "height": 1080}, "timestamp": "2025-11-21T08:52:02.000Z", "userAgent": "Mozilla/5.0 (IC-5 Test Script)"}', '2025-11-21 08:52:02.281', '2025-11-21 08:52:02.281'),
(9, 2, 'IC-5 Storage Test - Screenshot', 'Testing screenshot storage', 'high', 'open', NULL, NULL, '{"url": "https://example.com/storage-test", "screen": {"width": 1920, "height": 1080}, "language": "en-US", "timezone": "America/New_York", "viewport": {"width": 1920, "height": 1080}, "timestamp": "2025-11-21T08:52:05.000Z", "userAgent": "Mozilla/5.0 (IC-5 Storage Test)"}', '2025-11-21 08:52:05.882', '2025-11-21 08:52:05.882'),
(10, 2, 'IC-5 Integration Test Issue', 'End-to-end integration test', 'high', 'in-progress', NULL, NULL, '{"url": "https://example.com/integration-test", "screen": {"width": 1920, "height": 1080}, "language": "en-US", "timezone": "America/New_York", "viewport": {"width": 1920, "height": 1080}, "timestamp": "2025-11-21T08:52:07.000Z", "userAgent": "Mozilla/5.0 (IC-5 Integration Test)"}', '2025-11-21 08:52:07.558', '2025-11-21 08:52:07.643'),
(11, 2, 'IC-5 Test Issue - Basic', 'This is a basic test issue for IC-5', 'medium', 'open', NULL, NULL, '{"url": "https://example.com/test", "screen": {"width": 1920, "height": 1080}, "language": "en-US", "timezone": "America/New_York", "viewport": {"width": 1920, "height": 1080}, "timestamp": "2025-11-21T08:54:48.000Z", "userAgent": "Mozilla/5.0 (IC-5 Test Script)"}', '2025-11-21 08:54:48.323', '2025-11-21 08:54:48.323'),
(12, 2, 'IC-5 Test Issue - With Screenshot', 'This issue includes a screenshot', 'high', 'open', NULL, NULL, '{"url": "https://example.com/test-screenshot", "screen": {"width": 1920, "height": 1080}, "language": "en-US", "timezone": "America/New_York", "viewport": {"width": 1920, "height": 1080}, "timestamp": "2025-11-21T08:54:48.000Z", "userAgent": "Mozilla/5.0 (IC-5 Test Script)"}', '2025-11-21 08:54:48.442', '2025-11-21 08:54:48.442'),
(13, 2, 'IC-5 Test Issue - With Logs', 'Updated description from IC-5 test script', 'medium', 'in-progress', NULL, NULL, '{"url": "https://example.com/test-logs", "screen": {"width": 1920, "height": 1080}, "language": "en-US", "timezone": "America/New_York", "viewport": {"width": 1920, "height": 1080}, "timestamp": "2025-11-21T08:54:48.000Z", "userAgent": "Mozilla/5.0 (IC-5 Test Script)"}', '2025-11-21 08:54:48.548', '2025-11-21 08:54:51.504'),
(14, 2, 'IC-5 Storage Test - Screenshot', 'Testing screenshot storage', 'high', 'open', NULL, NULL, '{"url": "https://example.com/storage-test", "screen": {"width": 1920, "height": 1080}, "language": "en-US", "timezone": "America/New_York", "viewport": {"width": 1920, "height": 1080}, "timestamp": "2025-11-21T08:54:52.000Z", "userAgent": "Mozilla/5.0 (IC-5 Storage Test)"}', '2025-11-21 08:54:52.742', '2025-11-21 08:54:52.742'),
(15, 2, 'IC-5 Integration Test Issue', 'End-to-end integration test', 'high', 'in-progress', NULL, NULL, '{"url": "https://example.com/integration-test", "screen": {"width": 1920, "height": 1080}, "language": "en-US", "timezone": "America/New_York", "viewport": {"width": 1920, "height": 1080}, "timestamp": "2025-11-21T08:54:54.000Z", "userAgent": "Mozilla/5.0 (IC-5 Integration Test)"}', '2025-11-21 08:54:54.282', '2025-11-21 09:22:43.102'),
(16, 2, 'ttest', 'test', 'medium', 'open', NULL, NULL, '{"url": "http://localhost:4502/admin/projects/2/test", "screen": {"width": 1440, "height": 900}, "language": "en-GB", "timezone": "Asia/Bangkok", "viewport": {"width": 723, "height": 823}, "timestamp": "2025-11-21T14:58:50.968Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15"}', '2025-11-21 14:58:51.02', '2025-11-21 14:58:51.02'),
(17, 2, 'test', 'test', 'medium', 'open', NULL, NULL, '{"url": "http://localhost:4502/admin/projects/2/test", "screen": {"width": 1440, "height": 900}, "language": "en-GB", "timezone": "Asia/Bangkok", "viewport": {"width": 723, "height": 823}, "timestamp": "2025-11-21T15:23:38.425Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15"}', '2025-11-21 15:23:38.45', '2025-11-21 15:23:38.45'),
(18, 2, 'teste', 'stest', 'medium', 'open', NULL, NULL, '{"url": "http://localhost:4502/admin/issues", "screen": {"width": 1920, "height": 1080}, "language": "en-GB", "timezone": "Asia/Bangkok", "viewport": {"width": 1622, "height": 975}, "timestamp": "2025-11-24T06:45:37.666Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15"}', '2025-11-24 06:45:37.693', '2025-11-24 06:45:37.693'),
(19, 2, 'test with capture', 'test with capture', 'medium', 'open', NULL, NULL, '{"url": "http://localhost:4502/admin/projects/2/test", "screen": {"width": 1920, "height": 1080}, "language": "en-GB", "timezone": "Asia/Bangkok", "viewport": {"width": 1918, "height": 975}, "timestamp": "2025-11-25T06:02:42.070Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15"}', '2025-11-25 06:02:42.13', '2025-11-25 06:02:42.13'),
(20, 2, 'testtest', 'tests', 'medium', 'open', NULL, NULL, '{"url": "http://localhost:4502/admin/projects/2/test", "screen": {"width": 1440, "height": 900}, "language": "en-GB", "timezone": "Asia/Bangkok", "viewport": {"width": 775, "height": 795}, "timestamp": "2025-11-25T06:29:15.352Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15"}', '2025-11-25 06:29:15.401', '2025-11-25 06:29:15.401'),
(21, 2, 'testtest', 'tests', 'medium', 'open', NULL, NULL, '{"url": "http://localhost:4502/admin/projects/2/test", "screen": {"width": 1440, "height": 900}, "language": "en-GB", "timezone": "Asia/Bangkok", "viewport": {"width": 775, "height": 795}, "timestamp": "2025-11-25T06:29:15.352Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15"}', '2025-11-25 06:41:36.566', '2025-11-25 06:41:36.566'),
(22, 2, 'Test Issue with Screenshot - 1764052903661', 'Testing screenshot and element selector storage', 'medium', 'open', NULL, NULL, '{"url": "http://localhost:4502/admin/projects/2/test", "screen": {"width": 1440, "height": 900}, "language": "en-GB", "timezone": "Asia/Bangkok", "viewport": {"width": 775, "height": 795}, "timestamp": "2025-11-25T06:41:43.661Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15"}', '2025-11-25 06:41:43.682', '2025-11-25 06:41:43.682'),
(23, 2, 'FULL TEST - 1764052918533', 'Full test with complete screenshot data', 'medium', 'open', NULL, NULL, '{"url": "http://localhost:4502/admin/projects/2/test", "screen": {"width": 1440, "height": 900}, "language": "en-GB", "timezone": "Asia/Bangkok", "viewport": {"width": 775, "height": 795}, "timestamp": "2025-11-25T06:41:58.533Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15"}', '2025-11-25 06:41:58.555', '2025-11-25 06:41:58.555'),
(24, 2, 'DIAGNOSTIC TEST - 1764053033436', 'Testing screenshot storage', 'medium', 'open', NULL, NULL, '{"url": "http://localhost:4502/admin/projects/2/test", "screen": {"width": 1440, "height": 900}, "language": "en-GB", "timezone": "Asia/Bangkok", "viewport": {"width": 775, "height": 795}, "timestamp": "2025-11-25T06:43:53.436Z", "userAgent": "Mozilla/5.0"}', '2025-11-25 06:43:53.46', '2025-11-25 06:43:53.46'),
(25, 2, 'VALIDATION TEST - 1764053057003', 'Testing if validation strips screenshot', 'medium', 'open', NULL, NULL, '{"url": "http://localhost:4502/admin/projects/2/test", "screen": {"width": 1440, "height": 900}, "language": "en-GB", "timezone": "Asia/Bangkok", "viewport": {"width": 775, "height": 795}, "timestamp": "2025-11-25T06:44:17.003Z", "userAgent": "Mozilla/5.0"}', '2025-11-25 06:44:17.104', '2025-11-25 06:44:17.104'),
(26, 2, 'TEST AFTER RESTART - 1764053140289', 'Testing screenshot storage after API restart', 'medium', 'open', NULL, NULL, '{"url": "http://localhost:4502/admin/projects/2/test", "screen": {"width": 1440, "height": 900}, "language": "en-GB", "timezone": "Asia/Bangkok", "viewport": {"width": 775, "height": 795}, "timestamp": "2025-11-25T06:45:40.289Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15"}', '2025-11-25 06:45:40.396', '2025-11-25 06:45:40.396'),
(27, 2, 'VALIDATION TEST', 'test', 'medium', 'open', NULL, NULL, '{"url": "http://localhost:4502/admin/projects/2/test", "screen": {"width": 1440, "height": 900}, "language": "en-GB", "timezone": "Asia/Bangkok", "viewport": {"width": 775, "height": 795}, "timestamp": "2025-11-25T06:45:54.019Z", "userAgent": "Mozilla/5.0"}', '2025-11-25 06:45:54.042', '2025-11-25 06:45:54.042'),
(28, 2, 'TEST AFTER FIX - 1764053221798', 'Testing after storage path fix', 'medium', 'open', NULL, NULL, '{"url": "http://localhost:4502/admin/projects/2/test", "screen": {"width": 1440, "height": 900}, "language": "en-GB", "timezone": "Asia/Bangkok", "viewport": {"width": 775, "height": 795}, "timestamp": "2025-11-25T06:47:01.798Z", "userAgent": "Mozilla/5.0"}', '2025-11-25 06:47:01.893', '2025-11-25 06:47:01.893'),
(29, 2, 'TEST PROJECT STRUCTURE - 1764053429672', 'Testing new project-based storage structure', 'medium', 'open', NULL, NULL, '{"url": "http://localhost:4502/admin/projects/2/test", "screen": {"width": 1440, "height": 900}, "language": "en-GB", "timezone": "Asia/Bangkok", "viewport": {"width": 775, "height": 795}, "timestamp": "2025-11-25T06:50:29.672Z", "userAgent": "Mozilla/5.0"}', '2025-11-25 06:50:29.775', '2025-11-25 06:50:29.775'),
(30, 2, 'sdfsdf', 'sdfds', 'medium', 'open', NULL, NULL, '{"url": "http://localhost:4502/admin/projects/2/test", "screen": {"width": 1440, "height": 900}, "language": "en-GB", "timezone": "Asia/Bangkok", "viewport": {"width": 1440, "height": 795}, "timestamp": "2025-11-25T07:19:00.195Z", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15"}', '2025-11-25 07:19:00.241', '2025-11-25 07:19:00.241');

INSERT INTO "public"."issue_screenshots" ("id", "issue_id", "storage_path", "storage_type", "mime_type", "width", "height", "file_size", "element_selector", "created_at") VALUES
(1, 28, 'screenshots/28/b273caf9-210a-418c-823b-8286583c1469.png', 'local', 'image/png', 1, 1, 95, '{"xpath": "/html/body/div[1]", "outerHTML": "<div>test fix</div>", "boundingBox": {"x": 10, "y": 20, "width": 100, "height": 50}, "cssSelector": "div.test-fix"}', '2025-11-25 06:47:01.917'),
(2, 29, 'screenshots/2/29/4daa8e5b-e2ec-47cb-9fb4-020237611f0f.png', 'local', 'image/png', 1, 1, 95, '{"xpath": "/html/body/div[1]", "outerHTML": "<div class=\"project-structure-test\">Test</div>", "boundingBox": {"x": 10, "y": 20, "width": 100, "height": 50}, "cssSelector": "div.project-structure-test"}', '2025-11-25 06:50:29.802'),
(3, 30, 'screenshots/2/30/0de7ab95-257a-407c-82f0-cfe637cec1d9.png', 'local', 'image/png', 1052, 200, 20388, '{"xpath": "/html/body/div[2]/div/div/div/div[3]/div/div/div/div[2]/div[2]", "outerHTML": "<div class=\"flex gap-4 rounded-lg bg-white p-4 dark:bg-gray-800\"><div class=\"flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white\">2</div><div class=\"flex-1\"><h4 class=\"font-semibold text-blue-900 dark:text-blue-100 mb-1\">Click to Open Issue Form</h4><p class=\"text-sm text-blue-800 dark:text-blue-200\">Click the button to open a modal dialog with a form to report your issue. You''ll see fields for Title, Description, and Severity.</p></div></div>", "boundingBox": {"x": 339, "y": 472, "width": 1052, "height": 80}, "cssSelector": "div.min-h-screen.xl:flex:nth-child(2) > div.flex-1.transition-all.duration-300:nth-child(2) > div.p-4.mx-auto.max-w-(--breakpoint-2xl):nth-child(2) > div.w-full > div.grid.gap-6.w-full:nth-child(3) > div.space-y-6 > div.space-y-6 > div.rounded-lg.border.border-blue-200:nth-child(1) > div.space-y-4:nth-child(2) > div.flex.gap-4.rounded-lg:nth-child(2)"}', '2025-11-25 07:19:00.275');

INSERT INTO "public"."issue_logs" ("id", "issue_id", "log_type", "level", "message", "stack", "metadata", "timestamp", "created_at") VALUES
(1, 3, 'console', 'error', 'Test console error', NULL, '{"source": "test"}', '2025-11-21 08:48:22', '2025-11-21 08:48:22.161'),
(2, 3, 'console', 'warn', 'Test console warning', NULL, NULL, '2025-11-21 08:48:22', '2025-11-21 08:48:22.161'),
(3, 3, 'error', 'error', 'Test JavaScript error', 'Error: Test JavaScript error
    at test.js:1:1', '{"line": 1, "column": 1, "source": "test.js"}', '2025-11-21 08:48:22', '2025-11-21 08:48:22.161'),
(4, 3, 'network', 'error', 'Network request failed', NULL, '{"url": "https://api.example.com/test", "method": "GET", "status": 500}', '2025-11-21 08:48:22', '2025-11-21 08:48:22.161'),
(5, 5, 'console', 'error', 'Integration test console error', NULL, NULL, '2025-11-21 08:49:05', '2025-11-21 08:49:05.584'),
(6, 5, 'error', 'error', 'Integration test JS error', 'Error: Integration test
    at test.js:1:1', '{}', '2025-11-21 08:49:05', '2025-11-21 08:49:05.584'),
(7, 5, 'network', 'error', 'Network error', NULL, '{"url": "https://api.example.com/integration", "method": "GET"}', '2025-11-21 08:49:05', '2025-11-21 08:49:05.584'),
(8, 8, 'console', 'error', 'Test console error', NULL, '{"source": "test"}', '2025-11-21 08:52:02', '2025-11-21 08:52:02.283'),
(9, 8, 'console', 'warn', 'Test console warning', NULL, NULL, '2025-11-21 08:52:02', '2025-11-21 08:52:02.283'),
(10, 8, 'error', 'error', 'Test JavaScript error', 'Error: Test JavaScript error
    at test.js:1:1', '{"line": 1, "column": 1, "source": "test.js"}', '2025-11-21 08:52:02', '2025-11-21 08:52:02.283'),
(11, 8, 'network', 'error', 'Network request failed', NULL, '{"url": "https://api.example.com/test", "method": "GET", "status": 500}', '2025-11-21 08:52:02', '2025-11-21 08:52:02.283'),
(12, 10, 'console', 'error', 'Integration test console error', NULL, NULL, '2025-11-21 08:52:07', '2025-11-21 08:52:07.561'),
(13, 10, 'error', 'error', 'Integration test JS error', 'Error: Integration test
    at test.js:1:1', '{}', '2025-11-21 08:52:07', '2025-11-21 08:52:07.561'),
(14, 10, 'network', 'error', 'Network error', NULL, '{"url": "https://api.example.com/integration", "method": "GET"}', '2025-11-21 08:52:07', '2025-11-21 08:52:07.561'),
(15, 13, 'console', 'error', 'Test console error', NULL, '{"source": "test"}', '2025-11-21 08:54:48', '2025-11-21 08:54:48.552'),
(16, 13, 'console', 'warn', 'Test console warning', NULL, NULL, '2025-11-21 08:54:48', '2025-11-21 08:54:48.552'),
(17, 13, 'error', 'error', 'Test JavaScript error', 'Error: Test JavaScript error
    at test.js:1:1', '{"line": 1, "column": 1, "source": "test.js"}', '2025-11-21 08:54:48', '2025-11-21 08:54:48.552'),
(18, 13, 'network', 'error', 'Network request failed', NULL, '{"url": "https://api.example.com/test", "method": "GET", "status": 500}', '2025-11-21 08:54:48', '2025-11-21 08:54:48.552'),
(19, 15, 'console', 'error', 'Integration test console error', NULL, NULL, '2025-11-21 08:54:54', '2025-11-21 08:54:54.292'),
(20, 15, 'error', 'error', 'Integration test JS error', 'Error: Integration test
    at test.js:1:1', '{}', '2025-11-21 08:54:54', '2025-11-21 08:54:54.292'),
(21, 15, 'network', 'error', 'Network error', NULL, '{"url": "https://api.example.com/integration", "method": "GET"}', '2025-11-21 08:54:54', '2025-11-21 08:54:54.292'),
(22, 16, 'console', 'log', 'Issue Collector Widget: Shadow root created', NULL, NULL, '2025-11-21 14:58:41.965', '2025-11-21 14:58:51.076'),
(23, 16, 'console', 'log', 'Issue Collector Widget: Button created {}', NULL, '[{}]', '2025-11-21 14:58:41.966', '2025-11-21 14:58:51.076'),
(24, 16, 'console', 'log', 'Issue Collector Widget: Container appended to body', NULL, NULL, '2025-11-21 14:58:41.967', '2025-11-21 14:58:51.076'),
(25, 17, 'console', 'log', 'Issue Collector Widget: Shadow root created', NULL, NULL, '2025-11-21 15:23:24.952', '2025-11-21 15:23:38.491'),
(26, 17, 'console', 'log', 'Issue Collector Widget: Button created {}', NULL, '[{}]', '2025-11-21 15:23:24.957', '2025-11-21 15:23:38.491'),
(27, 17, 'console', 'log', 'Issue Collector Widget: Container appended to body', NULL, NULL, '2025-11-21 15:23:24.957', '2025-11-21 15:23:38.491'),
(28, 17, 'console', 'log', 'Widget initialized successfully', NULL, NULL, '2025-11-21 15:23:24.966', '2025-11-21 15:23:38.491'),
(29, 17, 'console', 'warn', 'Screenshot capture: falling back to element text due to unsupported color function "oklch"', NULL, NULL, '2025-11-21 15:23:31.397', '2025-11-21 15:23:38.491'),
(30, 18, 'console', 'log', 'Issue Collector Widget: Shadow root created', NULL, NULL, '2025-11-24 06:43:55.363', '2025-11-24 06:45:37.753'),
(31, 18, 'console', 'log', 'Issue Collector Widget: Button created {}', NULL, '[{}]', '2025-11-24 06:43:55.364', '2025-11-24 06:45:37.753'),
(32, 18, 'console', 'log', 'Issue Collector Widget: Container appended to body', NULL, NULL, '2025-11-24 06:43:55.364', '2025-11-24 06:45:37.753'),
(33, 18, 'console', 'log', 'Widget initialized successfully', NULL, NULL, '2025-11-24 06:43:55.366', '2025-11-24 06:45:37.753'),
(34, 18, 'console', 'warn', 'Screenshot capture: falling back to element text due to unsupported color function "oklch"', NULL, NULL, '2025-11-24 06:44:10.24', '2025-11-24 06:45:37.753'),
(35, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.353', '2025-11-24 06:45:37.753'),
(36, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.354', '2025-11-24 06:45:37.753'),
(37, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.354', '2025-11-24 06:45:37.753'),
(38, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.354', '2025-11-24 06:45:37.753'),
(39, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.355', '2025-11-24 06:45:37.753'),
(40, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.355', '2025-11-24 06:45:37.753'),
(41, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.356', '2025-11-24 06:45:37.753'),
(42, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.356', '2025-11-24 06:45:37.753'),
(43, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.356', '2025-11-24 06:45:37.753'),
(44, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.356', '2025-11-24 06:45:37.753'),
(45, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.357', '2025-11-24 06:45:37.753'),
(46, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.357', '2025-11-24 06:45:37.753'),
(47, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.357', '2025-11-24 06:45:37.753'),
(48, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.357', '2025-11-24 06:45:37.753'),
(49, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.358', '2025-11-24 06:45:37.753'),
(50, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.358', '2025-11-24 06:45:37.753'),
(51, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.358', '2025-11-24 06:45:37.753'),
(52, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.358', '2025-11-24 06:45:37.753'),
(53, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.359', '2025-11-24 06:45:37.753'),
(54, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.359', '2025-11-24 06:45:37.753'),
(55, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.359', '2025-11-24 06:45:37.753'),
(56, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.359', '2025-11-24 06:45:37.753'),
(57, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.36', '2025-11-24 06:45:37.753'),
(58, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.36', '2025-11-24 06:45:37.753'),
(59, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.36', '2025-11-24 06:45:37.753'),
(60, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.36', '2025-11-24 06:45:37.753'),
(61, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.361', '2025-11-24 06:45:37.753'),
(62, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.361', '2025-11-24 06:45:37.753'),
(63, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.361', '2025-11-24 06:45:37.753'),
(64, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.361', '2025-11-24 06:45:37.753'),
(65, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.362', '2025-11-24 06:45:37.753'),
(66, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.362', '2025-11-24 06:45:37.753'),
(67, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.363', '2025-11-24 06:45:37.753'),
(68, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.363', '2025-11-24 06:45:37.753'),
(69, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.383', '2025-11-24 06:45:37.753'),
(70, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.383', '2025-11-24 06:45:37.753'),
(71, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.384', '2025-11-24 06:45:37.753'),
(72, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.384', '2025-11-24 06:45:37.753'),
(73, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.384', '2025-11-24 06:45:37.753'),
(74, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.384', '2025-11-24 06:45:37.753'),
(75, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.385', '2025-11-24 06:45:37.753'),
(76, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.385', '2025-11-24 06:45:37.753'),
(77, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.385', '2025-11-24 06:45:37.753'),
(78, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.385', '2025-11-24 06:45:37.753'),
(79, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.385', '2025-11-24 06:45:37.753'),
(80, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.386', '2025-11-24 06:45:37.753'),
(81, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.386', '2025-11-24 06:45:37.753'),
(82, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.386', '2025-11-24 06:45:37.753'),
(83, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.386', '2025-11-24 06:45:37.753'),
(84, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.386', '2025-11-24 06:45:37.753'),
(85, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.386', '2025-11-24 06:45:37.753'),
(86, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.387', '2025-11-24 06:45:37.753'),
(87, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.387', '2025-11-24 06:45:37.753'),
(88, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.387', '2025-11-24 06:45:37.753'),
(89, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.387', '2025-11-24 06:45:37.753'),
(90, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.387', '2025-11-24 06:45:37.753'),
(91, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.388', '2025-11-24 06:45:37.753'),
(92, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.388', '2025-11-24 06:45:37.753'),
(93, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.388', '2025-11-24 06:45:37.753'),
(94, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.388', '2025-11-24 06:45:37.753'),
(95, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.389', '2025-11-24 06:45:37.753'),
(96, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.389', '2025-11-24 06:45:37.753'),
(97, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.389', '2025-11-24 06:45:37.753'),
(98, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.389', '2025-11-24 06:45:37.753'),
(99, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.389', '2025-11-24 06:45:37.753'),
(100, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.389', '2025-11-24 06:45:37.753'),
(101, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.39', '2025-11-24 06:45:37.753'),
(102, 18, 'console', 'log', 'i18next::translator: missingKey en translation common.table.actions.view common.table.actions.view', NULL, '["en", "translation", "common.table.actions.view", "common.table.actions.view"]', '2025-11-24 06:45:35.39', '2025-11-24 06:45:37.753'),
(103, 19, 'console', 'log', 'Issue Collector Widget: Shadow root created', NULL, NULL, '2025-11-25 06:02:13.213', '2025-11-25 06:02:42.186'),
(104, 19, 'console', 'log', 'Issue Collector Widget: Button created {}', NULL, '[{}]', '2025-11-25 06:02:13.214', '2025-11-25 06:02:42.186'),
(105, 19, 'console', 'log', 'Issue Collector Widget: Container appended to body', NULL, NULL, '2025-11-25 06:02:13.214', '2025-11-25 06:02:42.186'),
(106, 19, 'console', 'warn', 'Screenshot capture: falling back to element text due to unsupported color function "oklch"', NULL, NULL, '2025-11-25 06:02:22.933', '2025-11-25 06:02:42.186'),
(107, 20, 'console', 'log', 'Issue Collector Widget: Shadow root created', NULL, NULL, '2025-11-25 06:26:12.549', '2025-11-25 06:29:15.448'),
(108, 20, 'console', 'log', 'Issue Collector Widget: Button created {}', NULL, '[{}]', '2025-11-25 06:26:12.549', '2025-11-25 06:29:15.448'),
(109, 20, 'console', 'log', 'Issue Collector Widget: Container appended to body', NULL, NULL, '2025-11-25 06:26:12.55', '2025-11-25 06:29:15.448'),
(110, 20, 'console', 'warn', 'Screenshot capture: falling back to element text due to unsupported color function "oklch"', NULL, NULL, '2025-11-25 06:26:24.847', '2025-11-25 06:29:15.448'),
(111, 30, 'console', 'log', 'Issue Collector Widget: Shadow root created', NULL, NULL, '2025-11-25 07:18:12.894', '2025-11-25 07:19:00.28'),
(112, 30, 'console', 'log', 'Issue Collector Widget: Button created {}', NULL, '[{}]', '2025-11-25 07:18:12.896', '2025-11-25 07:19:00.28'),
(113, 30, 'console', 'log', 'Issue Collector Widget: Container appended to body', NULL, NULL, '2025-11-25 07:18:12.896', '2025-11-25 07:19:00.28'),
(114, 30, 'console', 'warn', 'Screenshot capture: falling back to element text due to unsupported color function "oklch"', NULL, NULL, '2025-11-25 07:18:22.323', '2025-11-25 07:19:00.28'),
(115, 30, 'console', 'log', '[Fast Refresh] rebuilding', NULL, NULL, '2025-11-25 07:18:30.911', '2025-11-25 07:19:00.28'),
(116, 30, 'console', 'log', '[Fast Refresh] done in 271ms', NULL, NULL, '2025-11-25 07:18:31.182', '2025-11-25 07:19:00.28');

INSERT INTO "public"."issue_comments" ("id", "issue_id", "user_id", "content", "created_at", "updated_at") VALUES
(1, 15, 1, 'Test comment from automated test script', '2025-11-21 09:22:43.133', '2025-11-21 09:22:43.133'),
(2, 17, 1, 'dfsdf', '2025-11-24 06:41:55.427', '2025-11-24 06:41:55.427');



-- Indices
CREATE INDEX seo_module_data_id_idx ON public.seo USING btree (module, data_id);
CREATE INDEX seo_slug_idx ON public.seo USING btree (slug);
CREATE INDEX seo_lang_idx ON public.seo USING btree (lang);
CREATE INDEX seo_module_type_idx ON public.seo USING btree (module, type);
CREATE INDEX seo_status_idx ON public.seo USING btree (status);
CREATE UNIQUE INDEX seo_module_type_data_id_lang_key ON public.seo USING btree (module, type, data_id, lang);
ALTER TABLE "public"."admin_menus" ADD FOREIGN KEY ("parent_id") REFERENCES "public"."admin_menus"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Indices
CREATE INDEX admin_menus_parent_id_sequence_idx ON public.admin_menus USING btree (parent_id, sequence);
CREATE INDEX admin_menus_status_idx ON public.admin_menus USING btree (status);
CREATE INDEX admin_menus_module_type_idx ON public.admin_menus USING btree (module, type);
ALTER TABLE "public"."admin_menu_translate" ADD FOREIGN KEY ("menu_id") REFERENCES "public"."admin_menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Indices
CREATE INDEX admin_menu_translate_menu_id_idx ON public.admin_menu_translate USING btree (menu_id);
CREATE INDEX admin_menu_translate_lang_idx ON public.admin_menu_translate USING btree (lang);
CREATE UNIQUE INDEX admin_menu_translate_menu_id_lang_key ON public.admin_menu_translate USING btree (menu_id, lang);


-- Indices
CREATE INDEX banners_type_idx ON public.banners USING btree (type);
CREATE INDEX banners_section_idx ON public.banners USING btree (section);
CREATE INDEX banners_sequence_idx ON public.banners USING btree (sequence);
CREATE INDEX banners_status_idx ON public.banners USING btree (status);
CREATE INDEX banners_deleted_at_idx ON public.banners USING btree (deleted_at);
CREATE INDEX banners_created_at_idx ON public.banners USING btree (created_at);
ALTER TABLE "public"."banners_translate" ADD FOREIGN KEY ("banner_id") REFERENCES "public"."banners"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Indices
CREATE INDEX banners_translate_banner_id_idx ON public.banners_translate USING btree (banner_id);
CREATE INDEX banners_translate_lang_idx ON public.banners_translate USING btree (lang);
CREATE UNIQUE INDEX banners_translate_banner_id_lang_key ON public.banners_translate USING btree (banner_id, lang);
ALTER TABLE "public"."contents" ADD FOREIGN KEY ("parent_id") REFERENCES "public"."contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Indices
CREATE INDEX contents_type_idx ON public.contents USING btree (type);
CREATE INDEX contents_parent_id_sequence_idx ON public.contents USING btree (parent_id, sequence);
CREATE INDEX contents_status_idx ON public.contents USING btree (status);
CREATE INDEX contents_view_idx ON public.contents USING btree (view);
CREATE INDEX contents_deleted_at_idx ON public.contents USING btree (deleted_at);
CREATE INDEX contents_created_at_idx ON public.contents USING btree (created_at);
ALTER TABLE "public"."content_translate" ADD FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Indices
CREATE INDEX content_translate_content_id_idx ON public.content_translate USING btree (content_id);
CREATE INDEX content_translate_lang_idx ON public.content_translate USING btree (lang);
CREATE UNIQUE INDEX content_translate_content_id_lang_key ON public.content_translate USING btree (content_id, lang);
ALTER TABLE "public"."content_and_categories" ADD FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."content_and_categories" ADD FOREIGN KEY ("category_id") REFERENCES "public"."content_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Indices
CREATE INDEX content_and_categories_content_id_idx ON public.content_and_categories USING btree (content_id);
CREATE INDEX content_and_categories_category_id_idx ON public.content_and_categories USING btree (category_id);
ALTER TABLE "public"."content_categories" ADD FOREIGN KEY ("parent_id") REFERENCES "public"."content_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Indices
CREATE INDEX content_categories_type_idx ON public.content_categories USING btree (type);
CREATE INDEX content_categories_parent_id_sequence_idx ON public.content_categories USING btree (parent_id, sequence);
CREATE INDEX content_categories_status_idx ON public.content_categories USING btree (status);
CREATE INDEX content_categories_deleted_at_idx ON public.content_categories USING btree (deleted_at);
CREATE INDEX content_categories_created_at_idx ON public.content_categories USING btree (created_at);
ALTER TABLE "public"."content_view" ADD FOREIGN KEY ("content_id") REFERENCES "public"."contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Indices
CREATE INDEX content_view_content_id_idx ON public.content_view USING btree (content_id);
CREATE INDEX content_view_type_idx ON public.content_view USING btree (type);
CREATE INDEX content_view_ip_idx ON public.content_view USING btree (ip);
CREATE INDEX content_view_created_at_idx ON public.content_view USING btree (created_at);
ALTER TABLE "public"."content_category_translate" ADD FOREIGN KEY ("category_id") REFERENCES "public"."content_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Indices
CREATE INDEX content_category_translate_category_id_idx ON public.content_category_translate USING btree (category_id);
CREATE INDEX content_category_translate_lang_idx ON public.content_category_translate USING btree (lang);
CREATE UNIQUE INDEX content_category_translate_category_id_lang_key ON public.content_category_translate USING btree (category_id, lang);
ALTER TABLE "public"."languages" ADD FOREIGN KEY ("setting_id") REFERENCES "public"."setting"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Indices
CREATE UNIQUE INDEX languages_code_key ON public.languages USING btree (code);
CREATE INDEX languages_setting_id_idx ON public.languages USING btree (setting_id);
CREATE INDEX languages_status_idx ON public.languages USING btree (status);
ALTER TABLE "public"."settings_translate" ADD FOREIGN KEY ("setting_id") REFERENCES "public"."setting"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Indices
CREATE INDEX settings_translate_setting_id_idx ON public.settings_translate USING btree (setting_id);
CREATE INDEX settings_translate_lang_idx ON public.settings_translate USING btree (lang);
CREATE UNIQUE INDEX settings_translate_setting_id_field_lang_key ON public.settings_translate USING btree (setting_id, field, lang);


-- Indices
CREATE INDEX user_roles_scope_idx ON public.user_roles USING btree (scope);
CREATE INDEX user_roles_scope_sequence_idx ON public.user_roles USING btree (scope, sequence);
CREATE INDEX user_roles_scope_status_idx ON public.user_roles USING btree (scope, status);
CREATE INDEX user_roles_status_idx ON public.user_roles USING btree (status);
CREATE INDEX user_roles_sequence_idx ON public.user_roles USING btree (sequence);
ALTER TABLE "public"."user_users" ADD FOREIGN KEY ("role_id") REFERENCES "public"."user_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Indices
CREATE UNIQUE INDEX user_users_username_key ON public.user_users USING btree (username);
CREATE UNIQUE INDEX user_users_email_key ON public.user_users USING btree (email);
CREATE INDEX user_users_role_id_idx ON public.user_users USING btree (role_id);
CREATE INDEX user_users_username_idx ON public.user_users USING btree (username);
CREATE INDEX user_users_email_idx ON public.user_users USING btree (email);
CREATE INDEX user_users_status_idx ON public.user_users USING btree (status);
CREATE INDEX user_users_deleted_at_idx ON public.user_users USING btree (deleted_at);


-- Indices
CREATE UNIQUE INDEX permissions_pkey ON public.user_permissions USING btree (id);
CREATE INDEX permissions_scope_idx ON public.user_permissions USING btree (scope);
CREATE INDEX permissions_scope_module_idx ON public.user_permissions USING btree (scope, module);
CREATE INDEX permissions_scope_is_active_idx ON public.user_permissions USING btree (scope, is_active);
CREATE INDEX permissions_is_active_idx ON public.user_permissions USING btree (is_active);
CREATE INDEX permissions_module_idx ON public.user_permissions USING btree (module);
CREATE UNIQUE INDEX permissions_scope_method_type_path_key ON public.user_permissions USING btree (scope, method, type, path);
CREATE UNIQUE INDEX permissions_scope_meta_name_key ON public.user_permissions USING btree (scope, meta_name);
ALTER TABLE "public"."user_roles_permissions" ADD FOREIGN KEY ("permission_id") REFERENCES "public"."user_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."user_roles_permissions" ADD FOREIGN KEY ("role_id") REFERENCES "public"."user_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Indices
CREATE UNIQUE INDEX role_permissions_pkey ON public.user_roles_permissions USING btree (role_id, permission_id);
CREATE INDEX role_permissions_permission_id_idx ON public.user_roles_permissions USING btree (permission_id);
CREATE INDEX role_permissions_role_id_idx ON public.user_roles_permissions USING btree (role_id);
ALTER TABLE "public"."activity_logs" ADD FOREIGN KEY ("user_id") REFERENCES "public"."user_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Indices
CREATE INDEX activity_logs_user_id_idx ON public.activity_logs USING btree (user_id);
CREATE INDEX activity_logs_model_idx ON public.activity_logs USING btree (model);
CREATE INDEX activity_logs_model_id_idx ON public.activity_logs USING btree (model_id);
CREATE INDEX activity_logs_action_idx ON public.activity_logs USING btree (action);
CREATE INDEX activity_logs_created_at_idx ON public.activity_logs USING btree (created_at);
CREATE INDEX activity_logs_model_model_id_idx ON public.activity_logs USING btree (model, model_id);
CREATE INDEX activity_logs_user_id_created_at_idx ON public.activity_logs USING btree (user_id, created_at);


-- Indices
CREATE UNIQUE INDEX pages_type_key ON public.pages USING btree (type);
CREATE INDEX pages_type_idx ON public.pages USING btree (type);
CREATE INDEX pages_status_idx ON public.pages USING btree (status);
CREATE INDEX pages_created_at_idx ON public.pages USING btree (created_at);
CREATE INDEX pages_deleted_at_idx ON public.pages USING btree (deleted_at);
ALTER TABLE "public"."page_translate" ADD FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Indices
CREATE INDEX page_translate_page_id_idx ON public.page_translate USING btree (page_id);
CREATE INDEX page_translate_lang_idx ON public.page_translate USING btree (lang);
CREATE UNIQUE INDEX page_translate_page_id_lang_key ON public.page_translate USING btree (page_id, lang);


-- Indices
CREATE UNIQUE INDEX "projects_publicKey_key" ON public.projects USING btree ("publicKey");
CREATE UNIQUE INDEX "projects_privateKey_key" ON public.projects USING btree ("privateKey");
CREATE INDEX projects_status_idx ON public.projects USING btree (status);
CREATE INDEX projects_deleted_at_idx ON public.projects USING btree (deleted_at);
CREATE INDEX projects_created_at_idx ON public.projects USING btree (created_at);
ALTER TABLE "public"."project_environments" ADD FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Indices
CREATE INDEX project_environments_project_id_idx ON public.project_environments USING btree (project_id);
CREATE INDEX project_environments_is_active_idx ON public.project_environments USING btree (is_active);
CREATE UNIQUE INDEX project_environments_project_id_name_key ON public.project_environments USING btree (project_id, name);
ALTER TABLE "public"."issues" ADD FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."issues" ADD FOREIGN KEY ("assignee_id") REFERENCES "public"."user_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Indices
CREATE INDEX issues_project_id_idx ON public.issues USING btree (project_id);
CREATE INDEX issues_status_idx ON public.issues USING btree (status);
CREATE INDEX issues_severity_idx ON public.issues USING btree (severity);
CREATE INDEX issues_created_at_idx ON public.issues USING btree (created_at);
ALTER TABLE "public"."issue_screenshots" ADD FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Indices
CREATE INDEX issue_screenshots_issue_id_idx ON public.issue_screenshots USING btree (issue_id);
ALTER TABLE "public"."issue_logs" ADD FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Indices
CREATE INDEX issue_logs_issue_id_idx ON public.issue_logs USING btree (issue_id);
CREATE INDEX issue_logs_log_type_idx ON public.issue_logs USING btree (log_type);
CREATE INDEX issue_logs_level_idx ON public.issue_logs USING btree (level);
ALTER TABLE "public"."issue_comments" ADD FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."issue_comments" ADD FOREIGN KEY ("user_id") REFERENCES "public"."user_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Indices
CREATE INDEX issue_comments_issue_id_idx ON public.issue_comments USING btree (issue_id);
CREATE INDEX issue_comments_user_id_idx ON public.issue_comments USING btree (user_id);
