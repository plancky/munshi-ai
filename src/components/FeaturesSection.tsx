import React from "react";
interface FeaturesSectionProps extends React.HTMLAttributes<HTMLElement> {
    title?: string;
    desc?: string;
    blocks?: Block[];
}

type Block = {
    id: string;
    title: string;
    desc?: string;
    logo?: JSX.Element | object | string;
};

const TITLE = "Features";
const DESC =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
const BLOCKS: Block[] = [
    {
        id: "e73bffae-c164-4ac4-99da-cecf532e090b",
        title: "Effciency",
        desc: "Get more efficient",
        logo: "smth",
    },
    {
        id: "8107919c-4c65-4eb9-999f-8b458ff5857a",
        title: "Reliablity",
        desc: "Get more reliable",
        logo: "smth",
    },
    {
        id: "8107919c-4c65-4eb9-999f-8b458ff5857a",
        title: "Feature 3",
        desc: "Get more reliable",
        logo: "smth",
    },
    {
        id: "8107919c-4c65-4eb9-999f-8b458ff5857a",
        title: "Feature 4",
        desc: "Get more reliable",
        logo: "smth",
    },
];

export default function DefaultFeaturesSection() {
    return <FeaturesSection title={TITLE} desc={DESC} blocks={BLOCKS} />;
}

export function FeaturesSection({
    title,
    desc,
    blocks,
    ...props
}: FeaturesSectionProps) {
    return (
        <section
            {...props}
            className="flex flex-col flex-wrap items-center py-10 lg:min-h-screen xl:flex-row"
        >
            <div className="flex w-full flex-1">
                <div className="flex flex-1 flex-col justify-center gap-5 lg:h-full xl:max-w-[440px]">
                    <span className="font-heading text-subheading_sm">
                        SMALL
                    </span>
                    <span className="font-heading text-xl">{title}</span>
                    <span className="font-primary text-body_lg">{desc}</span>
                </div>
            </div>
            <div className="flex w-full flex-1 flex-wrap items-center py-5 lg:h-full lg:pl-4">
                <ul className="grid w-full grid-cols-1 flex-wrap justify-start gap-5 lg:grid-cols-2">
                    {BLOCKS.map((block, index) => {
                        return (
                            <FeatureCard
                                key={`feature_block_${index}`}
                                id={block.id}
                                title={block.title}
                                description={block.desc}
                                Icon={block.logo}
                            />
                        );
                    })}
                </ul>
            </div>
        </section>
    );
}

const FeatureCard = ({ id, title, description, Icon }) => {
    return (
        <li
            key={id}
            className="aspect-square rounded-lg border border-primary p-5 text-center shadow-md"
        >
            {Icon && (
                <div className="mb-3 text-3xl">
                    <Icon />
                </div>
            )}
            <h3 className="mb-2 font-heading text-md">{title}</h3>
            <p className="font-primary text-body">{description}</p>
        </li>
    );
};
