import { env } from "cloudflare:workers";

export function getRuntimeEnv(): Cloudflare.Env & {
	R2_PUBLIC_BASE_URL: string;
	MEDIA: R2Bucket;
} {
	return env as Cloudflare.Env & {
		R2_PUBLIC_BASE_URL: string;
		MEDIA: R2Bucket;
	};
}
