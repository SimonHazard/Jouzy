import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ROOT_DOCUMENT_LANG } from "./__root";
import { AdminHomeComponent } from "./index";

describe("admin app scaffold", () => {
	it("renders the administration marker and French document contract", () => {
		render(<AdminHomeComponent />);

		expect(
			screen.getByRole("heading", { name: "Jouzy — administration" }),
		).toBeTruthy();
		expect(ROOT_DOCUMENT_LANG).toBe("fr");
	});
});
