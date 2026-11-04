type CatalogueCitationProps = {
    title: string
    href?: string
    author?: string
    publisher?: string
    className?: string
}

export default function CatalogueCitation({title, href, author, publisher, className}: CatalogueCitationProps) {
    const publication = [publisher].filter(Boolean).join(', ')
    return (
        <p className={className}>
            {author && <>{author}; </>}
            <em>{href ? <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">{title}</a> : title}</em>
            {publication && <>; {publication}</>}
        </p>
    )
}
