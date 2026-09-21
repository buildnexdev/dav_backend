import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { pool } from '../config/db.js';

const STUDENT_COLUMNS = [
  ['nationality', "VARCHAR(80) DEFAULT 'Indian'"],
  ['religion', 'VARCHAR(80) DEFAULT NULL'],
  ['community', 'VARCHAR(80) DEFAULT NULL'],
  ['mother_tongue', 'VARCHAR(80) DEFAULT NULL'],
  ['aadhaar_number', 'VARCHAR(20) DEFAULT NULL'],
  ['birth_certificate', 'VARCHAR(255) DEFAULT NULL'],
  ['photograph', 'VARCHAR(255) DEFAULT NULL'],
  ['father_name', 'VARCHAR(150) DEFAULT NULL'],
  ['mother_name', 'VARCHAR(150) DEFAULT NULL'],
  ['father_qualification', 'VARCHAR(150) DEFAULT NULL'],
  ['mother_qualification', 'VARCHAR(150) DEFAULT NULL'],
  ['father_qualification_proof', 'VARCHAR(255) DEFAULT NULL'],
  ['mother_qualification_proof', 'VARCHAR(255) DEFAULT NULL'],
  ['father_occupation', 'VARCHAR(255) DEFAULT NULL'],
  ['mother_occupation', 'VARCHAR(255) DEFAULT NULL'],
  ['father_occupation_proof', 'VARCHAR(255) DEFAULT NULL'],
  ['mother_occupation_proof', 'VARCHAR(255) DEFAULT NULL'],
  ['annual_income', 'VARCHAR(80) DEFAULT NULL'],
  ['income_certificate', 'VARCHAR(255) DEFAULT NULL'],
  ['alternate_phone', 'VARCHAR(20) DEFAULT NULL'],
  ['alternate_email', 'VARCHAR(150) DEFAULT NULL'],
  ['address_line2', 'VARCHAR(255) DEFAULT NULL'],
  ['city', 'VARCHAR(100) DEFAULT NULL'],
  ['country', "VARCHAR(80) DEFAULT 'India'"],
  ['pincode', 'VARCHAR(12) DEFAULT NULL'],
  ['address_proof', 'VARCHAR(255) DEFAULT NULL'],
  ['flag_single_parent', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['flag_defence_civil', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['flag_differently_abled', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['flag_special_child', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['flag_guardianship', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['flag_sports_arts', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['flag_parent_alumni', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['flag_one_child_sibling', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['flag_two_children', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['flag_twins', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['other_details', 'TEXT'],
  ['other_documents', 'VARCHAR(255) DEFAULT NULL']
];

async function ensureColumn(conn, table, column, definition) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [env.db.name, table, column]
  );
  if (!Number(rows[0].total)) {
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}

export async function initDatabase() {
  try {
    const admin = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password
    });
    await admin.query(
      `CREATE DATABASE IF NOT EXISTS \`${env.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await admin.end();
  } catch (err) {
    // Dedicated app users often cannot CREATE DATABASE. The DB must already exist then.
    if (err.code !== 'ER_DBACCESS_DENIED_ERROR' && err.errno !== 1044) {
      throw err;
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role_id INT UNSIGNED NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        student_code VARCHAR(20) NOT NULL UNIQUE,
        user_id INT UNSIGNED DEFAULT NULL,
        name VARCHAR(150) NOT NULL,
        program VARCHAR(100) DEFAULT NULL,
        batch VARCHAR(50) DEFAULT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        email VARCHAR(150) DEFAULT NULL,
        attendance DECIMAL(5,2) DEFAULT 0,
        performance DECIMAL(5,2) DEFAULT 0,
        scholarship VARCHAR(100) DEFAULT 'None',
        status ENUM('Active','Inactive','Graduated') NOT NULL DEFAULT 'Active',
        gender VARCHAR(20) DEFAULT NULL,
        dob DATE DEFAULT NULL,
        address VARCHAR(255) DEFAULT NULL,
        state VARCHAR(100) DEFAULT NULL,
        district VARCHAR(100) DEFAULT NULL,
        tenth DECIMAL(5,2) DEFAULT NULL,
        twelfth DECIMAL(5,2) DEFAULT NULL,
        degree VARCHAR(150) DEFAULT NULL,
        university VARCHAR(150) DEFAULT NULL,
        grad_year INT DEFAULT NULL,
        hostel VARCHAR(50) DEFAULT NULL,
        room VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_students_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE KEY uq_students_email (email),
        INDEX idx_students_name (name),
        INDEX idx_students_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    for (const [column, definition] of STUDENT_COLUMNS) {
      await ensureColumn(conn, 'students', column, definition);
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS mentors (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        mentor_code VARCHAR(20) NOT NULL UNIQUE,
        user_id INT UNSIGNED DEFAULT NULL,
        name VARCHAR(150) NOT NULL,
        photo VARCHAR(255) DEFAULT NULL,
        designation VARCHAR(150) DEFAULT NULL,
        subject VARCHAR(150) DEFAULT NULL,
        experience INT DEFAULT 0,
        expertise VARCHAR(255) DEFAULT NULL,
        bio TEXT,
        exam_category VARCHAR(100) DEFAULT NULL,
        qualification VARCHAR(150) DEFAULT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        email VARCHAR(150) DEFAULT NULL,
        gender VARCHAR(20) DEFAULT NULL,
        status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_mentors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE KEY uq_mentors_email (email),
        INDEX idx_mentors_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS academics (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        academic_code VARCHAR(20) NOT NULL UNIQUE,
        title VARCHAR(200) NOT NULL,
        type ENUM('Class','Test','Assignment','Mentorship','Schedule') NOT NULL DEFAULT 'Class',
        subject VARCHAR(150) DEFAULT NULL,
        program VARCHAR(100) DEFAULT NULL,
        batch VARCHAR(50) DEFAULT NULL,
        mentor_id INT UNSIGNED DEFAULT NULL,
        session_date DATE DEFAULT NULL,
        start_time VARCHAR(20) DEFAULT NULL,
        end_time VARCHAR(20) DEFAULT NULL,
        venue VARCHAR(150) DEFAULT NULL,
        description TEXT,
        status ENUM('Upcoming','Ongoing','Completed','Cancelled') NOT NULL DEFAULT 'Upcoming',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_academics_mentor FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE SET NULL,
        INDEX idx_academics_date (session_date),
        INDEX idx_academics_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        student_id INT UNSIGNED NOT NULL,
        attendance_date DATE NOT NULL,
        status ENUM('Present','Absent','Leave') NOT NULL DEFAULT 'Present',
        batch VARCHAR(50) DEFAULT NULL,
        remarks VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE KEY uq_attendance_student_date (student_id, attendance_date),
        INDEX idx_attendance_date (attendance_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS alumni (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        alumni_code VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        photo VARCHAR(255) DEFAULT NULL,
        year INT DEFAULT NULL,
        air INT DEFAULT NULL,
        service VARCHAR(80) DEFAULT NULL,
        cadre VARCHAR(100) DEFAULT NULL,
        optional_subject VARCHAR(150) DEFAULT NULL,
        current_designation VARCHAR(150) DEFAULT NULL,
        current_posting VARCHAR(150) DEFAULT NULL,
        testimonial TEXT,
        status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_alumni_status (status),
        INDEX idx_alumni_year (year)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS gallery_images (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        gallery_code VARCHAR(20) NOT NULL UNIQUE,
        field_name VARCHAR(120) NOT NULL,
        caption VARCHAR(255) DEFAULT NULL,
        image_path VARCHAR(255) NOT NULL,
        status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_gallery_field (field_name),
        INDEX idx_gallery_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS news (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        news_code VARCHAR(20) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT NULL,
        published_date DATE DEFAULT NULL,
        description TEXT,
        content TEXT,
        status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_news_status (status),
        INDEX idx_news_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        notification_code VARCHAR(20) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        type VARCHAR(80) DEFAULT NULL,
        channel VARCHAR(80) DEFAULT NULL,
        published_date DATE DEFAULT NULL,
        status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_notifications_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        payment_code VARCHAR(20) NOT NULL UNIQUE,
        student_id INT UNSIGNED DEFAULT NULL,
        payer_name VARCHAR(150) DEFAULT NULL,
        email VARCHAR(150) DEFAULT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        method VARCHAR(50) DEFAULT 'Razorpay',
        razorpay_order_id VARCHAR(80) DEFAULT NULL,
        razorpay_payment_id VARCHAR(80) DEFAULT NULL,
        razorpay_signature VARCHAR(255) DEFAULT NULL,
        receipt VARCHAR(80) DEFAULT NULL,
        status ENUM('Created','Pending','Completed','Failed') NOT NULL DEFAULT 'Created',
        notes VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_payments_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
        INDEX idx_payments_status (status),
        INDEX idx_payments_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS study_materials (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        material_code VARCHAR(20) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        subject VARCHAR(150) DEFAULT NULL,
        program VARCHAR(100) DEFAULT NULL,
        batch VARCHAR(50) DEFAULT NULL,
        description TEXT,
        file_path VARCHAR(255) DEFAULT NULL,
        external_url VARCHAR(500) DEFAULT NULL,
        status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_materials_subject (subject),
        INDEX idx_materials_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS test_results (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        result_code VARCHAR(20) NOT NULL UNIQUE,
        student_id INT UNSIGNED NOT NULL,
        academic_id INT UNSIGNED DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        subject VARCHAR(150) DEFAULT NULL,
        exam_date DATE DEFAULT NULL,
        marks DECIMAL(8,2) DEFAULT NULL,
        max_marks DECIMAL(8,2) DEFAULT 100,
        percentage DECIMAL(5,2) DEFAULT NULL,
        rank_no INT DEFAULT NULL,
        remarks VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_results_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        CONSTRAINT fk_results_academic FOREIGN KEY (academic_id) REFERENCES academics(id) ON DELETE SET NULL,
        INDEX idx_results_student (student_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        submission_code VARCHAR(20) NOT NULL UNIQUE,
        academic_id INT UNSIGNED NOT NULL,
        student_id INT UNSIGNED NOT NULL,
        content TEXT,
        file_path VARCHAR(255) DEFAULT NULL,
        status ENUM('Submitted','Graded','Returned') NOT NULL DEFAULT 'Submitted',
        score DECIMAL(8,2) DEFAULT NULL,
        feedback TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_submissions_academic FOREIGN KEY (academic_id) REFERENCES academics(id) ON DELETE CASCADE,
        CONSTRAINT fk_submissions_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE KEY uq_submission_academic_student (academic_id, student_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        application_code VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        dob DATE DEFAULT NULL,
        gender VARCHAR(20) DEFAULT NULL,
        phone VARCHAR(20) DEFAULT NULL,
        email VARCHAR(150) DEFAULT NULL,
        address VARCHAR(255) DEFAULT NULL,
        district VARCHAR(100) DEFAULT NULL,
        state VARCHAR(100) DEFAULT NULL,
        tenth DECIMAL(5,2) DEFAULT NULL,
        twelfth DECIMAL(5,2) DEFAULT NULL,
        degree VARCHAR(150) DEFAULT NULL,
        university VARCHAR(150) DEFAULT NULL,
        percentage DECIMAL(5,2) DEFAULT NULL,
        grad_year INT DEFAULT NULL,
        program VARCHAR(100) DEFAULT NULL,
        payment_id INT UNSIGNED DEFAULT NULL,
        status ENUM('Submitted','Under Review','Documents Verified','Exam Scheduled','Shortlisted','Interview','Selected','Rejected') NOT NULL DEFAULT 'Submitted',
        remarks VARCHAR(255) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_applications_payment FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
        INDEX idx_applications_status (status),
        INDEX idx_applications_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id TINYINT UNSIGNED PRIMARY KEY,
        student_pages TEXT NOT NULL,
        mentor_pages TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await conn.query(
      `INSERT IGNORE INTO settings (id, student_pages, mentor_pages) VALUES (1, ?, ?)`,
      [
        JSON.stringify([
          'dashboard', 'profile', 'timetable', 'attendance', 'tests', 'results',
          'materials', 'current-affairs', 'assignments', 'scholarship', 'announcements', 'payments'
        ]),
        JSON.stringify([
          'dashboard', 'profile', 'classes', 'attendance', 'students', 'tests',
          'assignments', 'materials', 'mentorship', 'announcements', 'reports'
        ])
      ]
    );

    await conn.query(`
      INSERT IGNORE INTO roles (id, name, description) VALUES
        (1, 'admin', 'Full access to admin panel'),
        (2, 'student', 'Student portal access'),
        (3, 'staff', 'Faculty / staff portal access')
    `);

    const [adminRows] = await conn.query(
      'SELECT id FROM users WHERE username = ? LIMIT 1',
      ['admin']
    );

    if (!adminRows.length) {
      const passwordHash = await bcrypt.hash('Admin@123', 10);
      await conn.query(
        'INSERT INTO users (username, password_hash, role_id, is_active) VALUES (?, ?, 1, 1)',
        ['admin', passwordHash]
      );
      console.log('Seeded default admin login: admin / Admin@123');
    }
  } finally {
    conn.release();
  }
}
