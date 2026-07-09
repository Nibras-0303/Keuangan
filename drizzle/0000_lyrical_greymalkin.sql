CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"color" text NOT NULL,
	"icon_name" text NOT NULL,
	"scope" text DEFAULT 'bersama' NOT NULL,
	"owner" text,
	"is_invested" boolean DEFAULT false NOT NULL,
	"investment_category" text,
	"is_seabank" boolean DEFAULT false NOT NULL,
	"seabank_interest_rate" real DEFAULT 3.75 NOT NULL,
	"seabank_interest_accumulated" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'IDR' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"details" json,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"amount" integer NOT NULL,
	"category_id" text,
	"period" text DEFAULT 'monthly' NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"scope" text DEFAULT 'bersama' NOT NULL,
	"owner" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"color" text DEFAULT 'blue' NOT NULL,
	"icon_name" text DEFAULT 'Tag' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"scope" text DEFAULT 'bersama' NOT NULL,
	"owner" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"target_amount" integer NOT NULL,
	"current_amount" integer DEFAULT 0 NOT NULL,
	"target_date" text,
	"color" text DEFAULT 'green' NOT NULL,
	"icon_name" text DEFAULT 'Target' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"scope" text DEFAULT 'bersama' NOT NULL,
	"owner" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "investments" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"account_id" text NOT NULL,
	"purchase_price" integer NOT NULL,
	"current_price" integer NOT NULL,
	"quantity" real NOT NULL,
	"purchase_date" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"user_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" text PRIMARY KEY NOT NULL,
	"image_url" text NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"date" text NOT NULL,
	"added_by" text NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"user1" text NOT NULL,
	"user2" text NOT NULL,
	"anniversary_date" text,
	"passcode" text NOT NULL,
	"monthly_budget" integer DEFAULT 3000000 NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"full_name" text NOT NULL,
	"avatar_url" text,
	"currency" text DEFAULT 'IDR' NOT NULL,
	"theme" text DEFAULT 'light' NOT NULL,
	"monthly_budget" integer DEFAULT 0 NOT NULL,
	"passcode" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" text PRIMARY KEY NOT NULL,
	"image_url" text NOT NULL,
	"merchant_name" text NOT NULL,
	"date" text NOT NULL,
	"total_amount" integer NOT NULL,
	"items" json NOT NULL,
	"status" text NOT NULL,
	"scanned_at" text NOT NULL,
	"added_by" text NOT NULL,
	"category" text,
	"category_id" text
);
--> statement-breakpoint
CREATE TABLE "recurring_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"account_id" text NOT NULL,
	"category" text NOT NULL,
	"category_id" text,
	"notes" text DEFAULT '' NOT NULL,
	"frequency" text NOT NULL,
	"next_due_date" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"added_by" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"account_id" text NOT NULL,
	"to_account_id" text,
	"category" text NOT NULL,
	"category_id" text,
	"date" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"receipt_id" text,
	"added_by" text NOT NULL,
	"created_at" text NOT NULL,
	"scope" text DEFAULT 'bersama' NOT NULL,
	"owner" text,
	"is_cleared" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_uid_unique" UNIQUE("uid")
);
