import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import {} from "@heroui/menu";
import {
  Navbar as HeroUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar";


import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  DiscordIcon,
  GithubIcon, HamburgerIcon,
  SearchIcon, TwitterIcon,
} from "@/components/icons";
import { Logo } from "@/components/icons";
import {Button} from "@heroui/react";
import {useState} from "react";


export const Navbar = ({setDrawerOpen}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const searchInput = (
    <Input
      aria-label="Search"
      classNames={{
        inputWrapper: "bg-default-100",
        input: "text-sm",
      }}
      endContent={
        <Kbd className="hidden lg:inline-block" keys={["command"]}>
          K
        </Kbd>
      }
      labelPlacement="outside"
      placeholder="Search..."
      startContent={
        <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
      }
      type="search"
    />
  );

  return (
      <div>
        <HeroUINavbar maxWidth="xl" position="sticky" shouldBlockScroll={true} >

          <NavbarContent className="sm:basis-full" justify="start">
            <NavbarBrand className="gap-3 max-w-fit">
              <Link
                  className="flex justify-start items-center gap-1"
                  color="foreground"
                  href="/"
              >
                {/* Add Menu Icon */}
                <Logo />
                <p className="font-bold">VISTONY</p>
              </Link>
            </NavbarBrand>
            <Button isIconOnly aria-label="Take a photo" color="default" variant="faded" onClick={()=>setDrawerOpen(true)}>
              <HamburgerIcon/>
            </Button>
            <NavbarContent className="md:hidden" justify="start">
              <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} className="text-white"/>
            </NavbarContent>
          </NavbarContent>


          <NavbarContent
              className="hidden sm:flex basis-1/5 sm:basis-full"
              justify="end"
          >
            <NavbarItem className="hidden sm:flex gap-2">
              <Link isExternal href={siteConfig.links.twitter} title="Twitter">
                <TwitterIcon className="text-default-500" />
              </Link>
              <Link isExternal href={siteConfig.links.discord} title="Discord">
                <DiscordIcon className="text-default-500" />
              </Link>
              <Link isExternal href={siteConfig.links.github} title="GitHub">
                <GithubIcon className="text-default-500" />
              </Link>
              <ThemeSwitch />
            </NavbarItem>
            <NavbarItem className="hidden lg:flex">{searchInput}</NavbarItem>
          </NavbarContent>

          <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
            <Link isExternal href={siteConfig.links.github}>
              <GithubIcon className="text-default-500" />
            </Link>
            <ThemeSwitch />
            <NavbarMenuToggle />
          </NavbarContent>

          <NavbarMenu>
            {searchInput}
            <div className="mx-4 mt-2 flex flex-col gap-2">
              {siteConfig.navMenuItems.map((item, index) => (
                  <NavbarMenuItem key={`${item}-${index}`}>
                    <Link
                        color={
                          index === 2
                              ? "primary"
                              : index === siteConfig.navMenuItems.length - 1
                                  ? "danger"
                                  : "foreground"
                        }
                        href="#"
                        size="lg"
                    >
                      {item.label}
                    </Link>
                  </NavbarMenuItem>
              ))}
            </div>
          </NavbarMenu>

        </HeroUINavbar>
      </div>
  );
};
