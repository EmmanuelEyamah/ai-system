-- AlterTable
ALTER TABLE `chats` ADD COLUMN `analysis_model` VARCHAR(191) NOT NULL DEFAULT 'gpt-4o',
    ADD COLUMN `generation_model` VARCHAR(191) NOT NULL DEFAULT 'claude-sonnet-4.6';
