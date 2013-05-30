DROP TABLE IF EXISTS `logs`;
CREATE TABLE `logs` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nick` varchar(45) NOT NULL,
  `message` text NOT NULL,
  `ts` datetime NOT NULL,
  `channel` varchar(45) NOT NULL,
  `host` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=155 DEFAULT CHARSET=utf8;