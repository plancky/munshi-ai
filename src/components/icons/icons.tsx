type IconProps = React.HTMLAttributes<SVGElement>;
import VideoTitleIcon from "./videoTitleIcon.svg?inline";
import AuthorIcon from "./authorsIcon.svg?inline"; 
import CloseIcon from "./close.svg?inline";

export const Icons = {
    Menu: (props: IconProps) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
    ),
    close: (props: IconProps) => <CloseIcon {...props} />,
    VideoTitleIcon: (props: IconProps) => <VideoTitleIcon {...props} />,
    AuthorIcon: (props: IconProps) => <AuthorIcon {...props} />,
};
