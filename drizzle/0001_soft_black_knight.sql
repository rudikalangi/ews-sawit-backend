ALTER TABLE "afdelings" ALTER COLUMN "boundary_polygon" SET DATA TYPE geometry(MultiPolygon, 4326);--> statement-breakpoint
ALTER TABLE "bloks" ALTER COLUMN "boundary_polygon" SET DATA TYPE geometry(MultiPolygon, 4326);--> statement-breakpoint
ALTER TABLE "estates" ALTER COLUMN "boundary_polygon" SET DATA TYPE geometry(MultiPolygon, 4326);