'use client'

import Link from "next/link";
import Image from "next/image";
import posthog from "posthog-js";

const Navbar = () => {
    const handleLogoClick = () => {
        posthog.capture('navbar_logo_clicked', {
            navigation_target: '/',
        });
    };

    const handleHomeClick = () => {
        posthog.capture('navbar_home_clicked', {
            navigation_target: '/',
        });
    };

    const handleEventsClick = () => {
        posthog.capture('navbar_events_clicked', {
            navigation_target: '/',
        });
    };

    const handleCreateEventClick = () => {
        posthog.capture('navbar_create_event_clicked', {
            navigation_target: '/',
        });
    };

    return (
        <header>
            <nav>
                <Link href="/" className="logo" onClick={handleLogoClick}>
                    <Image src="/icons/logo.png" alt="logo" width="24" height="24" />

                    <p>DevEvent</p>
                </Link>

                <ul>
                    <Link href="/" onClick={handleHomeClick}>Home</Link>
                    <Link href="/" onClick={handleEventsClick}>Events</Link>
                    <Link href="/" onClick={handleCreateEventClick}>Create Event</Link>
                </ul>
            </nav>
        </header>
    )
}
export default Navbar
