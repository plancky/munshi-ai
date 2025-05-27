const BLOCKS: Block[] = [
    {
        id: "e73bffae-c164-4ac4-99da-cecf532e090b",
        title: "FREE",
        desc: "Get started for free! Our AI-powered tool will quickly transcribe your audio, giving you a taste of how easy it is to extract key insights. Perfect for podcasters who want to explore the benefits of AI transcription without any commitment.",
        logo: "smth",
    },
    {
        id: "8107919c-4c65-4eb9-999f-8b458ff5857a",
        title: "Premium",
        desc: "Unlock the full potential of your podcasts. Our Premium plan provides extensive transcription minutes, accurate speaker identification, and in-depth summaries. Get actionable insights and repurpose your content with ease.",
        logo: "smth",
    },
    {
        id: "8107919c-4c65-4eb9-999f-8b458ff5857a",
        title: "Enterprise",
        desc: "Empower your organization with enterprise-grade podcast intelligence. Our Enterprise plan offers unlimited transcription, advanced analytics, and seamless integrations. Gain deep insights into your content and audience. Unlock the power of your audio content at scale. With our Enterprise plan, you get unlimited transcription, advanced analytics, and personalized support. Contact us for a custom solution tailored to your needs.",
        logo: "smth",
    },
];

export default function DefaultPricingSection({
    ...props
}: React.HTMLAttributes<HTMLElement>) {
    return <PricingSection blocks={BLOCKS} {...props} />;
}

type Block = {
    id: string;
    title: string;
    desc?: string;
    logo?: object | string;
};

interface PricingSectionProps extends React.HTMLAttributes<HTMLElement> {
    blocks: Block[];
}

export function PricingSection({ blocks, ...props }: PricingSectionProps) {
    return (
        <section {...props} className="flex items-center py-10 lg:min-h-screen">
            <ul className="flex min-h-[30rem] w-full flex-col flex-wrap justify-center gap-10 lg:flex-row">
                {blocks.map((block) => {
                    return (
                        <li
                            id={`pricing_block_${block.id}`}
                            key={`pricing_block_${block.id}`}
                            className="min-h-[34rem] lg:min-w-[410px] flex-1 rounded-xl border border-primary p-5"
                        >
                            <div
                                id="header"
                                className="mb-4 font-heading text-4xl"
                            >
                                {block.title}
                            </div>
                            <div id="content" className="">
                                {block.desc}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
