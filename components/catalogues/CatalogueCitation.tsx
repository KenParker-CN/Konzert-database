type CatalogueCitationProps = {
    title: string
    author?: string
    publisher?: string
    year?: string
    className?: string
}

export default function CatalogueCitation({title, author, publisher, year, className}: CatalogueCitationProps) {
    const publication = [publisher, year].filter(Boolean).join(', ')
    return (
        <p className={className}>
            {author && <>{author}; </>}
            <em>{title}</em>
            {publication && <>; {publication}</>}
        </p>
    )
}
