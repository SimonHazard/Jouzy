import { ExternalEmbed } from "@jouzy/content";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("ExternalEmbed", () => {
	it("starts local and loads only the selected iframe after the click", () => {
		const embed = {
			provider: "youtube" as const,
			type: "video" as const,
			canonicalUrl: "https://www.youtube.com/watch?v=abc123",
			embedUrl: "https://www.youtube-nocookie.com/embed/abc123",
			label: "YouTube",
			iframe: {
				sandbox: "allow-scripts",
				allow: "encrypted-media",
				referrerPolicy: "strict-origin-when-cross-origin" as ReferrerPolicy,
			},
			directiveId: "directive-0",
			position: 0,
		};
		const { container } = render(<ExternalEmbed embed={embed} />);
		expect(container.querySelector("iframe")).toBeNull();
		fireEvent.click(
			screen.getByRole("button", { name: "Charger ce contenu externe" }),
		);
		expect(container.querySelector("iframe")?.getAttribute("src")).toBe(
			embed.embedUrl,
		);
	});
});
