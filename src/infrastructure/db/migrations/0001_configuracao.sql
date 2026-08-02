CREATE TABLE `configuracao` (
	`casa_id` text NOT NULL,
	`chave` text NOT NULL,
	`valor` text NOT NULL,
	`atualizado_em` integer NOT NULL,
	PRIMARY KEY(`casa_id`, `chave`),
	FOREIGN KEY (`casa_id`) REFERENCES `casa`(`id`) ON UPDATE no action ON DELETE cascade
);
