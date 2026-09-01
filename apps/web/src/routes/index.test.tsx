import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ROOT_DOCUMENT_LANG } from "./__root";
import { HomeComponent } from "./index";

describe("public app scaffold", () => {
	it("renders the public marker and French document contract", () => {
		render(<HomeComponent />);

		expect(
			screen.getByRole("heading", { name: "Jouzy — site public" }),
		).toBeTruthy();
		expect(ROOT_DOCUMENT_LANG).toBe("fr");
	});
});
