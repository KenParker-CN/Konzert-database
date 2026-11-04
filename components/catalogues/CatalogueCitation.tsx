type CatalogueCitationProps = {
    title: string
    author?: string
    publisher?: string
    className?: string
}

export default function CatalogueCitation({title, author, publisher, className}: CatalogueCitationProps) {
    const publication = [publisher].filter(Boolean).join(', ')
    return (
        <p className={className}>
            {author && <>{author}; </>}
            <em>{title}</em>
            {publication && <>; {publication}</>}
        </p>
    )
}
