interface SectionProps extends React.HTMLAttributes<HTMLElement> {}

export default function Section({ ...props }: SectionProps) {
    return <section {...props}></section>;
}
