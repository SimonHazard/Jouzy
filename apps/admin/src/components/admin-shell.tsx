import type { AuthorizationIdentity } from "@jouzy/domain";
import { Badge } from "@jouzy/ui/components/badge";
import { Button } from "@jouzy/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@jouzy/ui/components/dropdown-menu";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@jouzy/ui/components/sheet";
import { Link, Outlet } from "@tanstack/react-router";
import { MenuIcon } from "lucide-react";
import { type ReactNode, useState } from "react";

const baseNavigation = [
	{ to: "/" as const, label: "Tableau de bord" },
	{ to: "/articles" as const, label: "Publications" },
	{ to: "/media" as const, label: "Médias" },
	{ to: "/games" as const, label: "Jeux" },
	{ to: "/taxonomies" as const, label: "Taxonomies" },
];

export function getNavigationItems(identity: AuthorizationIdentity) {
	return identity.role === "admin"
		? [...baseNavigation, { to: "/authors" as const, label: "Auteurs" }]
		: baseNavigation;
}

function Navigation({
	identity,
	onNavigate,
}: {
	identity: AuthorizationIdentity;
	onNavigate?: () => void;
}) {
	const items = getNavigationItems(identity);
	return (
		<nav aria-label="Navigation principale" className="flex flex-col gap-1">
			{items.map((item) => (
				<Link
					key={item.to}
					to={item.to}
					onClick={onNavigate}
					activeProps={{ className: "bg-accent text-accent-foreground" }}
					className="rounded-none px-3 py-2 text-muted-foreground text-sm hover:bg-accent hover:text-accent-foreground"
				>
					{item.label}
				</Link>
			))}
		</nav>
	);
}

export function AdminShell({
	identity,
	children,
}: {
	identity: AuthorizationIdentity;
	children?: ReactNode;
}) {
	const [mobileOpen, setMobileOpen] = useState(false);
	return (
		<div className="min-h-screen bg-background text-foreground">
			<header className="flex items-center justify-between border-b px-4 py-3 lg:px-8">
				<div className="flex items-center gap-3">
					<Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
						<SheetTrigger
							render={
								<Button
									variant="outline"
									size="icon-sm"
									className="lg:hidden"
									aria-label="Ouvrir la navigation"
								/>
							}
						>
							<MenuIcon aria-hidden="true" />
						</SheetTrigger>
						<SheetContent side="left" className="gap-0">
							<SheetHeader>
								<SheetTitle>Navigation Jouzy</SheetTitle>
							</SheetHeader>
							<div className="px-4">
								<Navigation
									identity={identity}
									onNavigate={() => setMobileOpen(false)}
								/>
							</div>
						</SheetContent>
					</Sheet>
					<div>
						<p className="font-heading font-semibold text-sm">Jouzy</p>
						<p className="text-muted-foreground text-xs">Administration</p>
					</div>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<Button variant="ghost" className="h-auto gap-2 px-2 py-1" />
						}
					>
						<span className="sr-only">Profil courant</span>
						<span
							aria-hidden="true"
							className="max-w-36 truncate text-left text-xs"
						>
							{identity.displayName}
						</span>
						<Badge variant="secondary">{identity.role}</Badge>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>{identity.email}</DropdownMenuLabel>
					</DropdownMenuContent>
				</DropdownMenu>
			</header>
			<div className="mx-auto grid w-full max-w-7xl lg:grid-cols-[13rem_1fr]">
				<aside className="hidden border-r px-4 py-6 lg:block">
					<Navigation identity={identity} />
				</aside>
				<div className="min-w-0">{children ?? <Outlet />}</div>
			</div>
		</div>
	);
}
