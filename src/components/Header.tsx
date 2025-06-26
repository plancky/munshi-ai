import { Button, buttonVariants } from "./ui/button";
import Logo from "@/logo/logo.svg?inline";

import {
    Drawer,
    DrawerTrigger,
    DrawerFooter,
    DrawerHeader,
    DrawerContent,
    DrawerTitle,
    DrawerDescription,
    DrawerClose,
    DrawerPortal,
    DrawerOverlay,
} from "@/components/ui/drawer";

import { Icons } from "./icons/icons";

export default function Header() {
    return (
        <div className="full-width relative z-10">
            <header className="full-width fixed w-full py-8 lg:bg-transparent">
                <div className="flex items-center justify-between rounded-lg bg-white/80 backdrop-blur-xl border border-border shadow-sm px-4 py-3">
                    <a href="/" className="flex items-center gap-2">
                        <span className="font-normal">
                            <Logo className="h-10" />
                        </span>
                        <span className="hidden font-heading text-subheading_lg lg:block">
                            Munshi
                        </span>
                    </a>
                    <div className="flex">
                        <Drawer direction="right">
                            <DrawerPortal>
                                <DrawerOverlay className="fixed inset-0 bg-black/40" />
                                <DrawerContent className="right-[-100px] h-full w-full rounded-none bg-destructive text-primary-foreground [&>div:first-child]:hidden">
                                    <div className="">
                                        <DrawerHeader>
                                            <DrawerTitle className="pt-5">
                                                <div className="flex justify-between">
                                                    <div className="flex items-center gap-2 text-2xl font-normal text-primary-foreground">
                                                        <span className="font-normal">
                                                            <Logo className="h-10" />
                                                        </span>
                                                        <span>Munshi</span>
                                                    </div>
                                                    <DrawerClose>
                                                        <Button
                                                            variant="destructive"
                                                            className="rounded-none"
                                                        >
                                                            X
                                                        </Button>
                                                    </DrawerClose>
                                                </div>
                                            </DrawerTitle>
                                            <DrawerDescription className="pt-20 text-primary-foreground"></DrawerDescription>
                                        </DrawerHeader>
                                        <DrawerFooter>
                                            <Button className="hidden">
                                                Try Munshi
                                            </Button>
                                        </DrawerFooter>
                                    </div>
                                </DrawerContent>
                            </DrawerPortal>
                        </Drawer>
                    </div>
                </div>
            </header>
        </div>
    );
}
