CREATE TABLE `news_feed_output` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `site` varchar(45) NOT NULL,
  `output` text NOT NULL,
  `ts` datetime NOT NULL,
  `raw` text NOT NULL,
  `parsed` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;