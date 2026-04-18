-- =============================================================
--  Release Tracker — MySQL Schema
--  Compatible with: MySQL 8.0+
--  Tables: planning, platform_versions, deployments
--
--  Run: mysql -u root -p < schema.sql
-- =============================================================

CREATE DATABASE IF NOT EXISTS release_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE release_tracker;

-- =============================================================
-- TABLE 1: planning  (mirrors "Planning" tab)
-- =============================================================
CREATE TABLE IF NOT EXISTS planning (
  id            CHAR(36)       NOT NULL DEFAULT (UUID()),
  date          VARCHAR(20)    DEFAULT NULL,
  client        VARCHAR(100)   DEFAULT NULL,
  platform      VARCHAR(100)   DEFAULT NULL,
  branch        VARCHAR(200)   DEFAULT NULL,
  env           VARCHAR(50)    DEFAULT NULL,
  features      TEXT           DEFAULT NULL,
  status        VARCHAR(80)    DEFAULT NULL,
  owner         VARCHAR(100)   DEFAULT NULL,
  notes         TEXT           DEFAULT NULL,
  prod_release  VARCHAR(200)   DEFAULT NULL,
  build_number  VARCHAR(50)    DEFAULT NULL,
  commit_sha    VARCHAR(100)   DEFAULT NULL,
  triggered_by  VARCHAR(100)   DEFAULT NULL,
  pipeline_url  TEXT           DEFAULT NULL,
  auto_captured TINYINT(1)     NOT NULL DEFAULT 0,
  created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- TABLE 2: platform_versions  (mirrors "Platform Versions" tab)
-- =============================================================
CREATE TABLE IF NOT EXISTS platform_versions (
  id             CHAR(36)      NOT NULL DEFAULT (UUID()),
  type           VARCHAR(50)   DEFAULT NULL,
  component      VARCHAR(100)  DEFAULT NULL,
  client         VARCHAR(100)  DEFAULT NULL,
  prod_version   VARCHAR(50)   DEFAULT NULL,
  prev_version   VARCHAR(50)   DEFAULT NULL,
  branch         VARCHAR(200)  DEFAULT NULL,
  last_release   VARCHAR(30)   DEFAULT NULL,
  api_version    VARCHAR(100)  DEFAULT NULL,
  owner          VARCHAR(100)  DEFAULT NULL,
  store_status   VARCHAR(80)   DEFAULT NULL,
  store_link     TEXT          DEFAULT NULL,
  build_number   VARCHAR(50)   DEFAULT NULL,
  commit_sha     VARCHAR(100)  DEFAULT NULL,
  triggered_by   VARCHAR(100)  DEFAULT NULL,
  auto_captured  TINYINT(1)    NOT NULL DEFAULT 0,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- TABLE 3: deployments  (mirrors "Deployments / Next-Release" tab)
-- Primary CI/CD auto-capture table — Jenkins posts here
-- =============================================================
CREATE TABLE IF NOT EXISTS deployments (
  id               CHAR(36)     NOT NULL DEFAULT (UUID()),
  date             VARCHAR(20)  DEFAULT NULL,
  client           VARCHAR(100) NOT NULL,
  platform         VARCHAR(100) DEFAULT NULL,
  repo             VARCHAR(200) DEFAULT NULL,
  branch           VARCHAR(200) DEFAULT NULL,
  commit_id        VARCHAR(200) DEFAULT NULL,
  status           VARCHAR(80)  DEFAULT NULL,
  env              VARCHAR(50)  DEFAULT NULL,
  blocker          TEXT         DEFAULT NULL,
  feature_impacted TEXT         DEFAULT NULL,
  app_name         VARCHAR(100) DEFAULT NULL,
  build_number     VARCHAR(50)  DEFAULT NULL,
  pipeline_url     TEXT         DEFAULT NULL,
  duration_seconds INT          DEFAULT NULL,
  triggered_by     VARCHAR(100) DEFAULT NULL,
  ai_summary       TEXT         DEFAULT NULL,
  ai_risk          ENUM('low','medium','high') DEFAULT NULL,
  auto_captured    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX idx_planning_client    ON planning(client);
CREATE INDEX idx_planning_status    ON planning(status);
CREATE INDEX idx_planning_env       ON planning(env);
CREATE INDEX idx_planning_date      ON planning(date);

CREATE INDEX idx_versions_client    ON platform_versions(client);
CREATE INDEX idx_versions_component ON platform_versions(component);
CREATE INDEX idx_versions_status    ON platform_versions(store_status);

CREATE INDEX idx_deploy_client      ON deployments(client);
CREATE INDEX idx_deploy_status      ON deployments(status);
CREATE INDEX idx_deploy_env         ON deployments(env);
CREATE INDEX idx_deploy_date        ON deployments(date);
CREATE INDEX idx_deploy_branch      ON deployments(branch);
CREATE INDEX idx_deploy_created     ON deployments(created_at);

-- =============================================================
-- SEED DATA — from your Excel screenshots
-- =============================================================

INSERT INTO planning (date,client,platform,branch,env,features,status,owner,notes,prod_release,auto_captured) VALUES
('16-12-25','Themax','WebApp','release/v2.1.9','Preprod','Bug-Fixes, Skeleton Changes, Single widget Carousel/Grid view changes','QA-Passed','Thrivarna','QA approved on 17-12-25','Waiting for Mobiles testing',0),
('16-12-25','24Trains','WebApp','release/v2.1.9','Preprod','Category page merging, Time stamp on catchup cards, Persona API optimization Phase 1','QA In-progress','Thrivarna','QA Raised 31 issue','',0),
('17-12-25','Nexo_LG TV','Nexo_LG TV','tvaas_release/v0.0.5','Preprod','HotFix- Changing Channels issue','Released','Sudhakar','Done','Released by 17-12-25',0),
('17-12-25','WeeFree','Android Tv (Tvaas)','release/tvaas-1.0.0','Preprod','Single Grid Pagination and API implementation','Need to start','Roja','Released by 17-12-25','',0),
('17-12-25','TVBUSA SVOD','IOS mobile','origin/release/tvb-v8.120.6','Preprod','Bug fixes - complete App','QA In-progress','Anand','','',0),
('18-12-25','TVBUSA SVOD','Roku TV','master','Preprod','ATV- Bug Fixes, Token expired issues raised by customer','Need to start','Naveen J','Released to QA 19-12-25','',0),
('18-12-25','Themax','IOS mobile','origin/release/themax-v1.0.5','Preprod','Bug fixes - complete App, Prod issues fixed','QA-Passed','Anand','Ready to push to prod','',0),
('22-12-25','Themax','WebApp','release/v2.1.6','Prod (Hotfix)','100%-Coupon code issue','Released to QA','Thrivarna','Need to start testing','',0),
('22-12-25','Newsmax','API_JOBS','sit_branch','preprod','Latest Backend code','Released to QA','Ajay','waiting for frontend to deploy latest','',0),
('23-12-25','White label','API_JOBS, cms','sit_branch','SIT','Latest Backend code','Released','Adithya V','','',0),
('26-12-25','White label','API_JOBS, cms','sit_branch','SIT','assets improvements, zone filter changes','Released','Ashok','','Release by 26-12-25',0);

INSERT INTO platform_versions (type,component,client,prod_version,prev_version,branch,last_release,api_version,owner,store_status,store_link,auto_captured) VALUES
('OTT','Backend','Themax','2.3.4','2.3.3','release/v2.3.4','24-3-26','2.3.4','Ashok','Live','',0),
('','API','Themax','1.3.1','1.1.0','release/v2.4.0','24-3-26','NA','Thrivarna','Live','',0),
('','iOS Mobile','Themax','1.0.7','1.0.6','release/wbl-release-v.2.0.0','24-2-26','Build_number:- 9','Anand','Live','',0),
('','Android Mobile','Themax','2.0.5','2.0.4','release/OTT-v2.0.0','23-3-26','App Build Number: 7','Salam','Live','https://d3zoc2jbbik3b.cloudfront.net/output/release/',0),
('','CMS','TVB SVOD','2.3.4','2.3.3','release/v2.3.4','4/3/2026','2.3.4','Ashok','Live','',0),
('','iOS Mobile','TVB SVOD','9.0.3','8.120.8','release/wbl-release-v.2.0.0','4/3/2026','','Siva','Live','',0),
('','Android TV','TVB SVOD','0.0.3','NA','release/tvbusa-0.0.3','18-12-25','0.0.3','Roja','Review','',0),
('','Roku','TVB SVOD','10.2.6','10.2.3','release/v1.4.0','23-12-25','NA','Naveen J','Live','',0),
('','Android Mobile','TVB SVOD','1.0.30','1.0.29','release/OTT-v2.0.0','24-2-26','App Build Number: 8822','Salam','Live','https://d3zoc2jbbik3b.cloudfront.net/output/release/',0),
('','iOS Mobile','24 Trains','1.0.6','1.0.5','release/wbl-release-v.2.0.0','4/3/2026','','Siva','Submitted to appstore','',0),
('','Android Mobile','24 Trains','1.8','1.7','release/OTT-v2.0.0','25-3-26','App Build Number: 10','salam','Live','https://d3zoc2jbbik3b.cloudfront.net/output/release/',0),
('','API','GDC','NA','NA','master','19-06-25','NA','Ashok','Live','',0),
('','iOS Mobile','GDC','1.0.6','NA','gdc-release','19-06-25','','Anand','Live','',0);

INSERT INTO deployments (date,client,platform,repo,branch,commit_id,status,env,blocker,feature_impacted,auto_captured) VALUES
('16-12-25','24Trains','24trains api, jobs','wlb_api','hotfix/expired-subscriptions','3a2ba24f','Live','Prod','','Adyen Payments issues, iOS payment',0),
('6/1/2026','24Trains','API, Jobs','wlb_api','hotfix/expired-subscriptions','57b0df87862ff81d63ac4ba3365cc2e6ce1bf9f2','','Prod','','',0),
('20-1-26','24Trains','Android Mobile','','mobile-master','Version-1.4','Live','Prod','','',0),
('27-1-26','24Trains','iOS Mobile','wlb_ios','release/wbl-release-v.2.0.0','','Released','Prod','','User logout issue - Hot Fix',0),
('28-1-26','24Trains','webapp','wlb_webapp','release/v2.2.0','f08bdee','Live','Prod','','Bug Fixes',0),
('30-1-26','24Trains','cms','wlb_cms','release/v2.3.3','ec3b811cd5467b6583da9c5ca909f131b860df25','QA-Passed','Prod','','banner preview image',0),
('30-1-26','24Trains','API & Jobs','wlb_api','release/v2.3.3','4d5196409a2bdb9e5d2f14ab81b3a2807a2dd70b','QA-Passed','Prod','','latest code',0),
('16-2-26','WeeFree','SDMC - 1.0.12','','release/tvaas-1.0.12','','Live','Prod','','permission changes for Tanix, device id on splash',0),
('16-2-26','WeeFree-Nexo','SDMC - 1.0.12','','release/tvaas-1.0.12','','Live','Prod','','',0),
('16-2-26','24Trains','iOS mobile','','release/wbl-release-v.2.0.0','Store_version:- 1.0.5 Build_number:- 5','UAT Review','Prod','','Rollout with bug fixes',0),
('16-2-26','Themax','iOS mobile','','release/wbl-release-v.2.0.0','Store_version:- 1.0.6 Build_number:- 5','UAT Review','Prod','','Rollout with bug fixes',0),
('16-2-26','TVBUSA SVOD','iOS mobile','','release/wbl-release-v.2.0.0','Store_version:- 8.120.8 Build_number:- 1','UAT Review','Prod','','Rollout with bug fixes',0),
('16-2-26','TVBUSA SVOD','LG, nexo_LG','wlb_tizen_lgwebos','tvaas_release/v0.0.22','a40384331278633df76cdb00a6d0a...','Live','Prod','continues loading issue','',0),
('17-2-26','TVBUSA - AVOD','api_jobs','wlb_api','release/v2.3.3','34dd26fdd162276241e7d42a29776...','','Prod','Fixed bundles issue in mrss feed job','',0);

SELECT 'MySQL schema created and seed data loaded.' AS result;
