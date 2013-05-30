DROP TABLE IF EXISTS `reminders`;
CREATE TABLE `reminders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nick` varchar(45) NOT NULL,
  `host` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL,
  `message` varchar(255) NOT NULL,
  `remind_at` datetime NOT NULL,
  `channel` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=0 DEFAULT CHARSET=utf8;