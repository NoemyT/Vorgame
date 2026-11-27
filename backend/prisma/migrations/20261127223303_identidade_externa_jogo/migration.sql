ALTER TABLE `Jogo`
    ADD COLUMN `provedor` VARCHAR(32) NULL,
    ADD COLUMN `idExterno` BIGINT UNSIGNED NULL,
    ADD UNIQUE INDEX `Jogo_provedor_idExterno_key` (`provedor`, `idExterno`);
