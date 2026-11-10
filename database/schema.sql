-- MySQL 8.0.16+ relational schema reference for Own Theme (enforced CHECK constraints).
-- Do not grant course access from an order row alone. Verify payments first,
-- then create or revoke enrollments in a trusted server-side transaction.

CREATE TABLE users (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  display_name VARCHAR(120) NOT NULL,
  profile_image_url VARCHAR(2048) NULL,
  role ENUM('student', 'instructor', 'admin') NOT NULL DEFAULT 'student',
  status ENUM('active', 'suspended', 'deletion_requested') NOT NULL DEFAULT 'active',
  notification_preferences JSON NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE course_categories (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  slug VARCHAR(140) NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE courses (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  category_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  instructor_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(220) NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  description MEDIUMTEXT NULL,
  level VARCHAR(80) NULL,
  thumbnail_asset_id VARCHAR(255) NULL,
  hero_asset_id VARCHAR(255) NULL,
  publication_status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  visibility ENUM('public', 'unlisted', 'private') NOT NULL DEFAULT 'public',
  sort_order INT NOT NULL DEFAULT 0,
  published_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_courses_category FOREIGN KEY (category_id) REFERENCES course_categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_courses_instructor FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_courses_publication (publication_status, visibility, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE modules (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  course_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  publication_status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_modules_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY uq_modules_course_order (course_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE lessons (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  module_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  title VARCHAR(200) NOT NULL,
  summary TEXT NULL,
  notes MEDIUMTEXT NULL,
  video_asset_id VARCHAR(255) NULL,
  duration_seconds INT UNSIGNED NULL,
  sort_order INT NOT NULL DEFAULT 0,
  access_level ENUM('preview', 'enrollment') NOT NULL DEFAULT 'enrollment',
  publication_status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_lessons_module FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  UNIQUE KEY uq_lessons_module_order (module_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE resources (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  lesson_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  title VARCHAR(200) NOT NULL,
  asset_id VARCHAR(255) NOT NULL,
  media_type VARCHAR(120) NULL,
  file_size_bytes BIGINT UNSIGNED NULL,
  access_level ENUM('preview', 'enrollment') NOT NULL DEFAULT 'enrollment',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_resources_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  INDEX idx_resources_lesson_order (lesson_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE products (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  type ENUM('course', 'bundle', 'subscription') NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  price DECIMAL(12,2) NOT NULL,
  currency CHAR(3) CHARACTER SET ascii NOT NULL,
  billing_interval ENUM('day', 'week', 'month', 'year') NULL,
  billing_interval_count SMALLINT UNSIGNED NULL,
  access_duration_days INT UNSIGNED NULL,
  access_rules JSON NULL,
  publication_status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  availability_status ENUM('available', 'paused', 'unavailable') NOT NULL DEFAULT 'unavailable',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT chk_products_price CHECK (price >= 0),
  CONSTRAINT chk_products_billing CHECK (
    (type = 'subscription' AND billing_interval IS NOT NULL AND billing_interval_count IS NOT NULL)
    OR (type <> 'subscription' AND billing_interval IS NULL AND billing_interval_count IS NULL)
  ),
  INDEX idx_products_listing (publication_status, availability_status, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_courses (
  product_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  course_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (product_id, course_id),
  CONSTRAINT fk_product_courses_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_product_courses_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE orders (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  order_number VARCHAR(40) NOT NULL UNIQUE,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  product_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) CHARACTER SET ascii NOT NULL,
  status ENUM('pending', 'paid', 'failed', 'cancelled', 'partially_refunded', 'refunded') NOT NULL DEFAULT 'pending',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_orders_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT chk_orders_amount CHECK (amount >= 0),
  INDEX idx_orders_user_date (user_id, created_at),
  INDEX idx_orders_status_date (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE payment_records (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  order_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  provider VARCHAR(80) NOT NULL,
  provider_reference VARCHAR(255) NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) CHARACTER SET ascii NOT NULL,
  status ENUM('pending', 'verified', 'failed', 'refunded', 'partially_refunded') NOT NULL DEFAULT 'pending',
  verified_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_payment_records_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
  CONSTRAINT chk_payment_records_amount CHECK (amount >= 0),
  UNIQUE KEY uq_payment_provider_reference (provider, provider_reference),
  INDEX idx_payment_records_order (order_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE payment_events (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  payment_record_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  provider VARCHAR(80) NOT NULL,
  provider_event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  signature_verified BOOLEAN NOT NULL DEFAULT FALSE,
  payload_digest CHAR(64) CHARACTER SET ascii NULL,
  processed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_payment_events_payment FOREIGN KEY (payment_record_id) REFERENCES payment_records(id) ON DELETE RESTRICT,
  UNIQUE KEY uq_payment_provider_event (provider, provider_event_id),
  INDEX idx_payment_events_payment (payment_record_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE subscriptions (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  product_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  initial_order_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  provider_subscription_reference VARCHAR(255) NULL,
  status ENUM('pending', 'active', 'past_due', 'cancelled', 'expired') NOT NULL DEFAULT 'pending',
  current_period_start DATETIME(3) NULL,
  current_period_end DATETIME(3) NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  cancelled_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_subscriptions_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
  CONSTRAINT fk_subscriptions_order FOREIGN KEY (initial_order_id) REFERENCES orders(id) ON DELETE RESTRICT,
  INDEX idx_subscriptions_user_status (user_id, status),
  INDEX idx_subscriptions_period_end (status, current_period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Enrollment rows are access grants, not purchase records. Create them only
-- after verifying a payment, confirming an active subscription, processing
-- free enrollment, or recording an explicit administrator grant.
CREATE TABLE enrollments (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  course_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  source_type ENUM('verified_order', 'active_subscription', 'free_enrollment', 'admin_grant') NOT NULL,
  source_order_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  source_subscription_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  granted_by_user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  status ENUM('active', 'revoked', 'expired') NOT NULL DEFAULT 'active',
  starts_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  ends_at DATETIME(3) NULL,
  revoked_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_enrollments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
  CONSTRAINT fk_enrollments_order FOREIGN KEY (source_order_id) REFERENCES orders(id) ON DELETE RESTRICT,
  CONSTRAINT fk_enrollments_subscription FOREIGN KEY (source_subscription_id) REFERENCES subscriptions(id) ON DELETE RESTRICT,
  CONSTRAINT fk_enrollments_grantor FOREIGN KEY (granted_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_enrollments_source CHECK (
    (source_type = 'verified_order' AND source_order_id IS NOT NULL AND source_subscription_id IS NULL)
    OR (source_type = 'active_subscription' AND source_order_id IS NULL AND source_subscription_id IS NOT NULL)
    OR (source_type = 'free_enrollment' AND source_order_id IS NULL AND source_subscription_id IS NULL)
    OR (source_type = 'admin_grant' AND source_order_id IS NULL AND source_subscription_id IS NULL AND granted_by_user_id IS NOT NULL)
  ),
  INDEX idx_enrollments_access (user_id, course_id, status, starts_at, ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE lesson_progress (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  lesson_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  playback_position_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  completed_at DATETIME(3) NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_lesson_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_lesson_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  UNIQUE KEY uq_lesson_progress_user_lesson (user_id, lesson_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE assignments (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  course_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  lesson_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  title VARCHAR(200) NOT NULL,
  instructions MEDIUMTEXT NOT NULL,
  requirements JSON NULL,
  evaluation_criteria JSON NULL,
  due_at DATETIME(3) NULL,
  publication_status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'draft',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_assignments_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_assignments_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
  INDEX idx_assignments_course_status (course_id, publication_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE submissions (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  assignment_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  student_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  previous_submission_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  work_url VARCHAR(2048) NULL,
  notes MEDIUMTEXT NULL,
  status ENUM('draft', 'submitted', 'under_review', 'revision_requested', 'completed') NOT NULL DEFAULT 'draft',
  submitted_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_submissions_assignment FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE RESTRICT,
  CONSTRAINT fk_submissions_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_submissions_previous FOREIGN KEY (previous_submission_id) REFERENCES submissions(id) ON DELETE SET NULL,
  INDEX idx_submissions_student_assignment (student_id, assignment_id, created_at),
  INDEX idx_submissions_review_queue (status, submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE feedback (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  submission_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  instructor_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  comments MEDIUMTEXT NOT NULL,
  criterion_feedback JSON NULL,
  review_status ENUM('under_review', 'revision_requested', 'completed') NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_feedback_submission FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE RESTRICT,
  CONSTRAINT fk_feedback_instructor FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_feedback_submission_date (submission_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE theme_sheets (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  title VARCHAR(200) NOT NULL,
  premise TEXT NULL,
  rhythm TEXT NULL,
  color TEXT NULL,
  sound TEXT NULL,
  type_motion TEXT NULL,
  signature TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_theme_sheets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_theme_sheets_user_updated (user_id, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE submission_theme_sheets (
  submission_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  theme_sheet_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  attached_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (submission_id, theme_sheet_id),
  CONSTRAINT fk_submission_theme_submission FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  CONSTRAINT fk_submission_theme_sheet FOREIGN KEY (theme_sheet_id) REFERENCES theme_sheets(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE showcase_projects (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  student_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  course_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  submission_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  title VARCHAR(200) NOT NULL,
  description MEDIUMTEXT NULL,
  media_url VARCHAR(2048) NOT NULL,
  student_consented BOOLEAN NOT NULL DEFAULT FALSE,
  consented_at DATETIME(3) NULL,
  moderation_status ENUM('private', 'pending', 'changes_requested', 'approved', 'rejected', 'removed') NOT NULL DEFAULT 'private',
  moderated_by_user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  moderation_note TEXT NULL,
  moderated_at DATETIME(3) NULL,
  published_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_showcase_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_showcase_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  CONSTRAINT fk_showcase_submission FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE SET NULL,
  CONSTRAINT fk_showcase_moderator FOREIGN KEY (moderated_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_showcase_approval_consent CHECK (moderation_status <> 'approved' OR student_consented = TRUE),
  INDEX idx_showcase_public (moderation_status, published_at),
  INDEX idx_showcase_student (student_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE notifications (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  type VARCHAR(80) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  resource_type VARCHAR(80) NULL,
  resource_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  read_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_inbox (user_id, read_at, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
