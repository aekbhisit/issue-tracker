-- CreateTable
CREATE TABLE "admin_menus" (
    "id" SERIAL NOT NULL,
    "icon" TEXT,
    "path" TEXT,
    "parent_id" INTEGER,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "module" TEXT,
    "type" TEXT,
    "required_group" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_menu_translate" (
    "id" SERIAL NOT NULL,
    "menu_id" INTEGER NOT NULL,
    "lang" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_menu_translate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" SERIAL NOT NULL,
    "type" TEXT,
    "style" TEXT,
    "image" TEXT,
    "mobile" TEXT,
    "youtube" TEXT,
    "video" TEXT,
    "link" TEXT,
    "target" BOOLEAN NOT NULL DEFAULT false,
    "view" INTEGER NOT NULL DEFAULT 0,
    "section" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners_translate" (
    "id" SERIAL NOT NULL,
    "banner_id" INTEGER NOT NULL,
    "lang" TEXT NOT NULL,
    "name" TEXT,
    "desc" TEXT,
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "banners_translate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contents" (
    "id" SERIAL NOT NULL,
    "type" TEXT,
    "gallery" JSONB,
    "image" TEXT,
    "video" TEXT,
    "youtube" TEXT,
    "file" TEXT,
    "publish_at" TIMESTAMP(3),
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "start_time" TEXT,
    "end_time" TEXT,
    "link" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "view" INTEGER NOT NULL DEFAULT 0,
    "default" BOOLEAN NOT NULL DEFAULT false,
    "parent_id" INTEGER,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "car_empty" TEXT,
    "tenants" TEXT,
    "color_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_translate" (
    "id" SERIAL NOT NULL,
    "content_id" INTEGER NOT NULL,
    "lang" TEXT NOT NULL,
    "name" TEXT,
    "desc" TEXT,
    "detail" TEXT,
    "text" TEXT,
    "location" TEXT,
    "prefix" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "content_translate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_and_categories" (
    "content_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,

    CONSTRAINT "content_and_categories_pkey" PRIMARY KEY ("content_id","category_id")
);

-- CreateTable
CREATE TABLE "content_view" (
    "id" SERIAL NOT NULL,
    "type" TEXT,
    "ip" TEXT,
    "content_id" INTEGER,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_view_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_categories" (
    "id" SERIAL NOT NULL,
    "type" TEXT,
    "image" TEXT,
    "gallery" JSONB,
    "video" TEXT,
    "youtube" TEXT,
    "file" TEXT,
    "default" BOOLEAN NOT NULL DEFAULT false,
    "parent_id" INTEGER,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "content_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_category_translate" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "lang" TEXT NOT NULL,
    "name" TEXT,
    "desc" TEXT,
    "detail" TEXT,
    "text" TEXT,
    "location" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "content_category_translate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seo" (
    "id" SERIAL NOT NULL,
    "module" TEXT NOT NULL,
    "type" TEXT,
    "data_id" INTEGER NOT NULL,
    "lang" TEXT NOT NULL,
    "slug" TEXT,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "meta_keyword" TEXT,
    "meta_image" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setting" (
    "id" SERIAL NOT NULL,
    "logo_header" TEXT,
    "logo_footer" TEXT,
    "right_click" BOOLEAN NOT NULL DEFAULT false,
    "grayscale" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" SERIAL NOT NULL,
    "setting_id" INTEGER,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "default" BOOLEAN NOT NULL DEFAULT false,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings_translate" (
    "id" SERIAL NOT NULL,
    "setting_id" INTEGER NOT NULL,
    "field" TEXT NOT NULL,
    "value" TEXT,
    "lang" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_translate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_users" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER,
    "name" TEXT,
    "username" TEXT,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "lang" TEXT NOT NULL DEFAULT 'en',
    "login_at" TIMESTAMP(3),
    "status" BOOLEAN NOT NULL DEFAULT false,
    "remember_token" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'admin',
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" SERIAL NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'admin',
    "method" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "type" TEXT,
    "group" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "meta_name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles_permissions" (
    "role_id" INTEGER NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateIndex
CREATE INDEX "admin_menus_parent_id_sequence_idx" ON "admin_menus"("parent_id", "sequence");

-- CreateIndex
CREATE INDEX "admin_menus_status_idx" ON "admin_menus"("status");

-- CreateIndex
CREATE INDEX "admin_menus_module_type_idx" ON "admin_menus"("module", "type");

-- CreateIndex
CREATE INDEX "admin_menu_translate_menu_id_idx" ON "admin_menu_translate"("menu_id");

-- CreateIndex
CREATE INDEX "admin_menu_translate_lang_idx" ON "admin_menu_translate"("lang");

-- CreateIndex
CREATE UNIQUE INDEX "admin_menu_translate_menu_id_lang_key" ON "admin_menu_translate"("menu_id", "lang");

-- CreateIndex
CREATE INDEX "banners_type_idx" ON "banners"("type");

-- CreateIndex
CREATE INDEX "banners_section_idx" ON "banners"("section");

-- CreateIndex
CREATE INDEX "banners_sequence_idx" ON "banners"("sequence");

-- CreateIndex
CREATE INDEX "banners_status_idx" ON "banners"("status");

-- CreateIndex
CREATE INDEX "banners_deleted_at_idx" ON "banners"("deleted_at");

-- CreateIndex
CREATE INDEX "banners_created_at_idx" ON "banners"("created_at");

-- CreateIndex
CREATE INDEX "banners_translate_banner_id_idx" ON "banners_translate"("banner_id");

-- CreateIndex
CREATE INDEX "banners_translate_lang_idx" ON "banners_translate"("lang");

-- CreateIndex
CREATE UNIQUE INDEX "banners_translate_banner_id_lang_key" ON "banners_translate"("banner_id", "lang");

-- CreateIndex
CREATE INDEX "contents_type_idx" ON "contents"("type");

-- CreateIndex
CREATE INDEX "contents_parent_id_sequence_idx" ON "contents"("parent_id", "sequence");

-- CreateIndex
CREATE INDEX "contents_status_idx" ON "contents"("status");

-- CreateIndex
CREATE INDEX "contents_view_idx" ON "contents"("view");

-- CreateIndex
CREATE INDEX "contents_deleted_at_idx" ON "contents"("deleted_at");

-- CreateIndex
CREATE INDEX "contents_created_at_idx" ON "contents"("created_at");

-- CreateIndex
CREATE INDEX "content_translate_content_id_idx" ON "content_translate"("content_id");

-- CreateIndex
CREATE INDEX "content_translate_lang_idx" ON "content_translate"("lang");

-- CreateIndex
CREATE UNIQUE INDEX "content_translate_content_id_lang_key" ON "content_translate"("content_id", "lang");

-- CreateIndex
CREATE INDEX "content_and_categories_content_id_idx" ON "content_and_categories"("content_id");

-- CreateIndex
CREATE INDEX "content_and_categories_category_id_idx" ON "content_and_categories"("category_id");

-- CreateIndex
CREATE INDEX "content_view_content_id_idx" ON "content_view"("content_id");

-- CreateIndex
CREATE INDEX "content_view_type_idx" ON "content_view"("type");

-- CreateIndex
CREATE INDEX "content_view_ip_idx" ON "content_view"("ip");

-- CreateIndex
CREATE INDEX "content_view_created_at_idx" ON "content_view"("created_at");

-- CreateIndex
CREATE INDEX "content_categories_type_idx" ON "content_categories"("type");

-- CreateIndex
CREATE INDEX "content_categories_parent_id_sequence_idx" ON "content_categories"("parent_id", "sequence");

-- CreateIndex
CREATE INDEX "content_categories_status_idx" ON "content_categories"("status");

-- CreateIndex
CREATE INDEX "content_categories_deleted_at_idx" ON "content_categories"("deleted_at");

-- CreateIndex
CREATE INDEX "content_categories_created_at_idx" ON "content_categories"("created_at");

-- CreateIndex
CREATE INDEX "content_category_translate_category_id_idx" ON "content_category_translate"("category_id");

-- CreateIndex
CREATE INDEX "content_category_translate_lang_idx" ON "content_category_translate"("lang");

-- CreateIndex
CREATE UNIQUE INDEX "content_category_translate_category_id_lang_key" ON "content_category_translate"("category_id", "lang");

-- CreateIndex
CREATE INDEX "seo_module_data_id_idx" ON "seo"("module", "data_id");

-- CreateIndex
CREATE INDEX "seo_slug_idx" ON "seo"("slug");

-- CreateIndex
CREATE INDEX "seo_lang_idx" ON "seo"("lang");

-- CreateIndex
CREATE INDEX "seo_module_type_idx" ON "seo"("module", "type");

-- CreateIndex
CREATE INDEX "seo_status_idx" ON "seo"("status");

-- CreateIndex
CREATE UNIQUE INDEX "seo_module_type_data_id_lang_key" ON "seo"("module", "type", "data_id", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");

-- CreateIndex
CREATE INDEX "languages_setting_id_idx" ON "languages"("setting_id");

-- CreateIndex
CREATE INDEX "languages_status_idx" ON "languages"("status");

-- CreateIndex
CREATE INDEX "settings_translate_setting_id_idx" ON "settings_translate"("setting_id");

-- CreateIndex
CREATE INDEX "settings_translate_lang_idx" ON "settings_translate"("lang");

-- CreateIndex
CREATE UNIQUE INDEX "settings_translate_setting_id_field_lang_key" ON "settings_translate"("setting_id", "field", "lang");

-- CreateIndex
CREATE UNIQUE INDEX "user_users_username_key" ON "user_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "user_users_email_key" ON "user_users"("email");

-- CreateIndex
CREATE INDEX "user_users_role_id_idx" ON "user_users"("role_id");

-- CreateIndex
CREATE INDEX "user_users_username_idx" ON "user_users"("username");

-- CreateIndex
CREATE INDEX "user_users_email_idx" ON "user_users"("email");

-- CreateIndex
CREATE INDEX "user_users_status_idx" ON "user_users"("status");

-- CreateIndex
CREATE INDEX "user_users_deleted_at_idx" ON "user_users"("deleted_at");

-- CreateIndex
CREATE INDEX "user_roles_scope_idx" ON "user_roles"("scope");

-- CreateIndex
CREATE INDEX "user_roles_scope_sequence_idx" ON "user_roles"("scope", "sequence");

-- CreateIndex
CREATE INDEX "user_roles_scope_status_idx" ON "user_roles"("scope", "status");

-- CreateIndex
CREATE INDEX "user_roles_status_idx" ON "user_roles"("status");

-- CreateIndex
CREATE INDEX "user_roles_sequence_idx" ON "user_roles"("sequence");

-- CreateIndex
CREATE INDEX "permissions_scope_idx" ON "user_permissions"("scope");

-- CreateIndex
CREATE INDEX "permissions_scope_module_idx" ON "user_permissions"("scope", "module");

-- CreateIndex
CREATE INDEX "permissions_scope_is_active_idx" ON "user_permissions"("scope", "is_active");

-- CreateIndex
CREATE INDEX "permissions_is_active_idx" ON "user_permissions"("is_active");

-- CreateIndex
CREATE INDEX "permissions_module_idx" ON "user_permissions"("module");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_scope_method_type_path_key" ON "user_permissions"("scope", "method", "type", "path");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_scope_meta_name_key" ON "user_permissions"("scope", "meta_name");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "user_roles_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "role_permissions_role_id_idx" ON "user_roles_permissions"("role_id");

-- AddForeignKey
ALTER TABLE "admin_menus" ADD CONSTRAINT "admin_menus_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "admin_menus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_menu_translate" ADD CONSTRAINT "admin_menu_translate_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "admin_menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banners_translate" ADD CONSTRAINT "banners_translate_banner_id_fkey" FOREIGN KEY ("banner_id") REFERENCES "banners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contents" ADD CONSTRAINT "contents_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_translate" ADD CONSTRAINT "content_translate_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_and_categories" ADD CONSTRAINT "content_and_categories_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_and_categories" ADD CONSTRAINT "content_and_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "content_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_view" ADD CONSTRAINT "content_view_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_categories" ADD CONSTRAINT "content_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "content_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_category_translate" ADD CONSTRAINT "content_category_translate_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "content_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "languages" ADD CONSTRAINT "languages_setting_id_fkey" FOREIGN KEY ("setting_id") REFERENCES "setting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings_translate" ADD CONSTRAINT "settings_translate_setting_id_fkey" FOREIGN KEY ("setting_id") REFERENCES "setting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_users" ADD CONSTRAINT "user_users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "user_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "user_permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "user_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
