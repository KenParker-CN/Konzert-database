type CatalogueCitationProps = {
    title: string
    href?: string
    linkLabel?: string
    author?: string
    publisher?: string
    className?: string
}

export default function CatalogueCitation({title, href, linkLabel, author, publisher, className}: CatalogueCitationProps) {
    return (
        <div className={className}>
            <p>
                {author && <>{author}; </>}
                <em>{title}</em>
                {publisher && <>; {publisher}</>}
            </p>
            {href && linkLabel && (
                <a href={href} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-blue-700 hover:underline">
                    {linkLabel}
                </a>
            )}
        </div>
    )
}
