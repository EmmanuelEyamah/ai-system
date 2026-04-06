-- AlterTable
ALTER TABLE `chats` MODIFY `analysis_model` VARCHAR(191) NOT NULL DEFAULT 'claude-sonnet-4',
    MODIFY `generation_model` VARCHAR(191) NOT NULL DEFAULT 'claude-sonnet-4';
