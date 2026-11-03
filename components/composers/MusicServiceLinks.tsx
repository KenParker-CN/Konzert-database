import {IconBrandApple, IconBrandSpotify, IconBrandTidal} from '@tabler/icons-react'

export default function MusicServiceLinks({name}: {name: string}) {
    const query = encodeURIComponent(name)
    const services = [
        {label: 'Spotify', href: `https://open.spotify.com/search/${query}`, icon: <IconBrandSpotify className="h-4 w-4" stroke={1.8}/>},
        {label: 'Apple Music', href: `https://music.apple.com/search?term=${query}`, icon: <IconBrandApple className="h-4 w-4" stroke={1.8}/>},
        {label: 'Tidal', href: `https://tidal.com/search?q=${query}`, icon: <IconBrandTidal className="h-4 w-4" stroke={1.8}/>},
        {label: 'MusicBrainz', href: `https://musicbrainz.org/search?query=${query}&type=artist&method=indexed`, icon: <span className="text-[10px] font-bold leading-none">MB</span>},
    ]

    return (
        <div className="flex items-center gap-1.5">
            {services.map(service => (
                <a
                    key={service.label}
                    href={service.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={service.label}
                    title={service.label}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-blue-300 hover:text-blue-700"
                >
                    {service.icon}
                </a>
            ))}
        </div>
    )
}
