CREATE TABLE `weather` (
  `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
  `location` VARCHAR(45) NOT NULL,
  `last_query` DATETIME NOT NULL,
  `nick` VARCHAR(45) NOT NULL,
  `host` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `unique_nick_and_host`(`nick`, `host`)
)
ENGINE = InnoDB
CHARACTER SET utf8 COLLATE utf8_general_ci;
