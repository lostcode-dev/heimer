import { useState, useEffect } from "react"
import { ChevronRight, Menu, X, Facebook, Twitter as TwitterIcon, Linkedin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"


const NAV_LINKS = [
	{ to: "#features", label: "Recursos" },
	{ to: "#testimonials", label: "Depoimentos" },
	{ to: "#pricing", label: "Preços" },
	{ to: "#faq", label: "FAQ" },
]

const FOOTER_SECTIONS = [
	{
		title: "Produto",
		links: [
			{ to: "#features", label: "Recursos" },
			{ to: "#pricing", label: "Preços" },
			{ to: "#", label: "Integrações" },
			{ to: "#", label: "API" },
		],
	},
	{
		title: "Materiais",
		links: [
			{ to: "#", label: "Documentação" },
			{ to: "#", label: "Guias" },
			{ to: "#", label: "Blog" },
			{ to: "#", label: "Suporte" },
		],
	},
	{
		title: "Empresa",
		links: [
			{ to: "#", label: "Sobre" },
			{ to: "#", label: "Carreiras" },
			{ to: "#", label: "Privacidade" },
			{ to: "#", label: "Termos" },
		],
	},
]

const SOCIALS = [
	{
		name: "Facebook",
		icon: Facebook,
	},
	{
		name: "Twitter",
		icon: TwitterIcon,
	},
	{
		name: "LinkedIn",
		icon: Linkedin,
	},
]

const FOOTER_BOTTOM_LINKS = [
	{ to: "#", label: "Política de Privacidade" },
	{ to: "#", label: "Termos de Serviço" },
	{ to: "#", label: "Política de Cookies" },
]

export function LandingLayout() {
	// Whitelabel simplificado: ajustes futuros podem carregar isso do backend/config
	const brandName = 'Heimer'
	const logo_path = '/vite.svg'

	const [isScrolled, setIsScrolled] = useState(false)
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const location = useLocation()
	const navigate = useNavigate()

	const scrollToTop = (e: React.MouseEvent) => {
		e.preventDefault()
		if (location.pathname === "/") {
			window.history.replaceState(null, "", window.location.pathname + window.location.search)
			window.scrollTo({ top: 0, behavior: "smooth" })
		} else {
			navigate("/")
		}
	}

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 10)
		}
		window.addEventListener("scroll", handleScroll)
		return () => window.removeEventListener("scroll", handleScroll)
	}, [])

	useEffect(() => {
		if (location.hash) {
			const el = document.getElementById(location.hash.replace("#", ""))
			if (el) {
				el.scrollIntoView({ behavior: "smooth" })
			}
		}
	}, [location.hash])

	return (
		<div className="flex min-h-[100dvh] flex-col">
			<header
				className={`border-b border-b-sidebar-border sticky top-0 z-50 w-full backdrop-blur-lg transition-all duration-300 ${
					isScrolled ? "bg-background/80 shadow-sm" : "bg-transparent"
				}`}
			>
				<div className="container flex h-16 items-center justify-between">
					<Link
						to="/"
						onClick={scrollToTop}
						className="flex items-center gap-2 font-bold"
						style={{ textDecoration: "none" }}
					>
						<img
							src={logo_path}
							alt={`${brandName} logo`}
							className="h-7 object-contain "
						/>
					</Link>
					<nav className="hidden md:flex gap-8">
						{NAV_LINKS.map((link) => (
							<Link
								key={link.label}
								to={link.to}
								className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
							>
								{link.label}
							</Link>
						))}
					</nav>
					<div className="hidden md:flex gap-4 items-center">
						<Link
							to="/auth/signin"
							className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							Entrar
						</Link>
						<Button
							className="rounded-full"
							asChild
						>
							<Link to="/auth/signup">
								Começar agora
								<ChevronRight className="ml-1 size-4" />
							</Link>
						</Button>
					</div>
					<div className="flex items-center gap-4 md:hidden">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						>
							{mobileMenuOpen ? (
								<X className="size-5" />
							) : (
								<Menu className="size-5" />
							)}
							<span className="sr-only">Toggle menu</span>
						</Button>
					</div>
				</div>
				{/* Mobile menu */}
				{mobileMenuOpen && (
					<div className="md:hidden absolute top-16 inset-x-0 bg-background/95 backdrop-blur-lg border-b">
						<div className="container py-4 flex flex-col gap-4">
							{NAV_LINKS.map((link) => (
								<Link
									key={link.label}
									to={link.to}
									className="py-2 text-sm font-medium"
									onClick={() => setMobileMenuOpen(false)}
								>
									{link.label}
								</Link>
							))}
							<div className="flex flex-col gap-2 pt-2 border-t">
								<Link
									to="/auth/signin"
									className="py-2 text-sm font-medium"
									onClick={() => setMobileMenuOpen(false)}
								>
									Entrar
								</Link>
								<Button className="rounded-full" asChild>
									<Link
										to="/auth/signup"
										onClick={() => setMobileMenuOpen(false)}
									>
										Começar agora
										<ChevronRight className="ml-1 size-4" />
									</Link>
								</Button>
							</div>
						</div>
					</div>
				)}
			</header>
			<main className="flex-1">
				<Outlet />
			</main>
			<footer className="w-full border-t bg-background/95 backdrop-blur-sm">
				<div className="container flex flex-col gap-8 px-4 py-10 md:px-6 lg:py-16">
					<div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
						<div className="space-y-4">
							<div className="flex items-center gap-2 font-bold">
								<img
									src={logo_path}
									alt={`${brandName} logo`}
									className="h-8 object-contain "
								/>
							</div>
							<p className="text-sm text-muted-foreground">
								O PDV que integra vendas, estoque e financeiro em uma experiência simples e poderosa.
							</p>
							<div className="flex gap-4">
								{SOCIALS.map((social) => {
									const Icon = social.icon
									return (
										<Link
											to="#"
											key={social.name}
											className="text-muted-foreground hover:text-foreground transition-colors"
										>
											<Icon className="size-5" />
											<span className="sr-only">{social.name}</span>
										</Link>
									)
								})}
							</div>
						</div>
						{FOOTER_SECTIONS.map((section) => (
							<div className="space-y-4" key={section.title}>
								<h4 className="text-sm font-bold">{section.title}</h4>
								<ul className="space-y-2 text-sm">
									{section.links.map((link) => (
										<li key={link.label}>
											<Link
												to={link.to}
												className="text-muted-foreground hover:text-foreground transition-colors"
											>
												{link.label}
											</Link>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
					<div className="flex flex-col gap-4 sm:flex-row justify-between items-center border-t border-border/40 pt-8">
						<p className="text-xs text-muted-foreground">
							&copy; {new Date().getFullYear()} {brandName}. Todos os direitos reservados.
						</p>
						<div className="flex gap-4">
							{FOOTER_BOTTOM_LINKS.map((link) => (
								<Link
									key={link.label}
									to={link.to}
									className="text-xs text-muted-foreground hover:text-foreground transition-colors"
								>
									{link.label}
								</Link>
							))}
						</div>
					</div>
				</div>
			</footer>
		</div>
	)
}
