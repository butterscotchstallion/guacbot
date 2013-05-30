DROP TABLE IF EXISTS `ignored`;
CREATE TABLE `ignored` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `host` varchar(255) NOT NULL,
  `ts` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_host` (`host`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
