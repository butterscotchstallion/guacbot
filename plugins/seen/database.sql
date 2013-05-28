CREATE TABLE `seen` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `nick` varchar(45) NOT NULL,
  `host` varchar(255) NOT NULL,
  `message` varchar(45) NOT NULL,
  `last_seen` datetime NOT NULL,
  `channel` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nick_channel_index` (`nick`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;