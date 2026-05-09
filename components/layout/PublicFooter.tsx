import Link from "next/link";
import { Facebook, Instagram, Youtube } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-stonehill-line bg-white py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div>
            <span className="text-xl font-bold text-stonehill-evergreen">Stonehill SDA Church</span>
            <p className="mt-4 text-sm text-stonehill-muted">
              A community of believers sharing the love of Jesus and preparing for His soon return.
            </p>
            <div className="mt-6 flex space-x-4 text-stonehill-muted">
              <a href="#" className="hover:text-stonehill-evergreen transition"><Facebook className="h-5 w-5" /></a>
              <a href="#" className="hover:text-stonehill-evergreen transition"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="hover:text-stonehill-evergreen transition"><Youtube className="h-5 w-5" /></a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 lg:col-span-2">
            <div>
              <h3 className="text-sm font-semibold text-stonehill-ink">Navigation</h3>
              <ul className="mt-4 space-y-2 text-sm text-stonehill-muted">
                <li><Link href="/im-new" className="hover:text-stonehill-evergreen transition">I'm New</Link></li>
                <li><Link href="/plan-your-visit" className="hover:text-stonehill-evergreen transition">Plan Your Visit</Link></li>
                <li><Link href="/sermons" className="hover:text-stonehill-evergreen transition">Sermons</Link></li>
                <li><Link href="/events" className="hover:text-stonehill-evergreen transition">Events</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stonehill-ink">Contact</h3>
              <ul className="mt-4 space-y-2 text-sm text-stonehill-muted">
                <li>123 Church Street</li>
                <li>Pflugerville, TX 78660</li>
                <li><a href="mailto:info@stonehillsda.org" className="hover:text-stonehill-evergreen transition">info@stonehillsda.org</a></li>
                <li>(555) 123-4567</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between border-t border-stonehill-line pt-8 sm:flex-row">
          <p className="text-xs leading-5 text-stonehill-muted">
            &copy; {new Date().getFullYear()} Stonehill Seventh-day Adventist Church. All rights reserved.
          </p>
          <div className="mt-4 flex space-x-4 sm:mt-0 text-xs text-stonehill-muted">
            <Link href="/privacy" className="hover:text-stonehill-evergreen transition">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-stonehill-evergreen transition">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

