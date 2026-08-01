import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Cookie,
  Database,
  ExternalLink,
  GraduationCap,
  Handshake,
  KeyRound,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Scale,
  ShieldCheck,
  UserCheck,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { useDocumentTitle } from '@/lib/use-document-title'

const LAST_UPDATED = 'August 1, 2026'

function UpdatedBadge() {
  return (
    <span className="rounded-full bg-card px-4 py-2 text-sm text-muted-foreground shadow-clay-sm ring-1 ring-foreground/5">
      Last updated {LAST_UPDATED}
    </span>
  )
}

function InfoSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children: React.ReactNode
}) {
  return (
    <Card className="gap-0">
      <CardHeader className="grid grid-cols-[auto_1fr] items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-clay-sm">
          <Icon className="size-5" />
        </span>
        <h2 className="text-xl font-semibold">{title}</h2>
      </CardHeader>
      <CardContent className="space-y-3 text-base leading-7 text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:pl-1 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2">
        {children}
      </CardContent>
    </Card>
  )
}

export function PrivacyPage() {
  useDocumentTitle('Privacy Policy')

  return (
    <div className="w-full">
      <PageHeader
        title="Privacy Policy"
        description="How DIU ACM collects, uses, and protects information on this platform."
      >
        <UpdatedBadge />
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-2">
        <InfoSection icon={Database} title="Information we collect">
          <p>We collect only the information needed to operate the community platform:</p>
          <ul>
            <li>
              Account details such as your name, DIU email address, username,
              student ID, profile image, and account role.
            </li>
            <li>
              Competitive-programming handles for Codeforces, VJudge, and
              AtCoder, together with public ratings and contest results from
              those services.
            </li>
            <li>
              Community activity such as event attendance, contest performance,
              upsolves, and interactions with published content.
            </li>
          </ul>
        </InfoSection>

        <InfoSection icon={BadgeCheck} title="How we use information">
          <p>
            We use this information to authenticate members, maintain profiles,
            run events and attendance, calculate ranklists, synchronize public
            contest results, moderate the platform, and keep the service secure.
          </p>
          <p>
            We do not sell personal information or use it for third-party
            advertising.
          </p>
        </InfoSection>

        <InfoSection icon={Cookie} title="Local storage and authentication">
          <p>
            When you sign in, the site stores an authentication token in your
            browser&apos;s local storage. It is sent to the DIU ACM API to keep
            you signed in and is removed when you log out. The site may also
            remember interface preferences such as your selected color theme.
          </p>
          <p>
            Never share your password or authentication token. DIU ACM
            administrators will not ask you to send either one.
          </p>
        </InfoSection>

        <InfoSection icon={Handshake} title="Services we rely on">
          <p>
            The platform may communicate with Google for sign-in and with
            Codeforces, VJudge, and AtCoder to retrieve public programming data.
            Those services process information under their own privacy policies.
          </p>
          <p>
            Application data and uploaded media are hosted using Cloudflare
            infrastructure. We share information only when needed to operate the
            service, protect users, or comply with a lawful requirement.
          </p>
        </InfoSection>

        <InfoSection icon={ShieldCheck} title="Retention, security, and your choices">
          <p>
            We retain account and participation records while they are useful
            for DIU ACM activities, historical ranklists, or platform security.
            Access is limited according to administrative permissions, and
            passwords created directly on the platform are stored as hashes.
          </p>
          <p>
            You can update supported profile information from your profile page.
            To request correction or deletion of other account information,
            please use the <Link to="/contact">Contact page</Link>. Some records
            may be retained when required for security, integrity, or legitimate
            event history.
          </p>
        </InfoSection>

        <InfoSection icon={AlertTriangle} title="Changes to this policy">
          <p>
            We may update this policy when the platform or its data practices
            change. The latest revision date will always appear at the top of
            this page. Continued use after an update means the revised policy
            applies to future use of the service.
          </p>
        </InfoSection>
      </div>
    </div>
  )
}

export function TermsPage() {
  useDocumentTitle('Terms of Use')

  return (
    <div className="w-full">
      <PageHeader
        title="Terms of Use"
        description="The rules that keep DIU ACM’s platform fair, useful, and safe for the community."
      >
        <UpdatedBadge />
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-2">
        <InfoSection icon={UserCheck} title="Who may use the platform">
          <p>
            This service is intended for the DIU ACM and Daffodil International
            University community. You must provide accurate account information,
            use only accounts and competitive-programming handles you are
            authorized to represent, and keep your sign-in credentials secure.
          </p>
        </InfoSection>

        <InfoSection icon={Scale} title="Fair and acceptable use">
          <p>You agree not to:</p>
          <ul>
            <li>falsify attendance, contest results, identities, or handles;</li>
            <li>harass others or publish unlawful, abusive, or deceptive content;</li>
            <li>
              probe, disrupt, overload, scrape excessively, or attempt to bypass
              the platform&apos;s access controls;
            </li>
            <li>
              upload media or writing that you do not have permission to share;
            </li>
            <li>use the service in a way that harms DIU ACM, DIU, or other users.</li>
          </ul>
        </InfoSection>

        <InfoSection icon={GraduationCap} title="Events, attendance, and ranklists">
          <p>
            Event schedules, eligibility, attendance windows, scoring rules, and
            ranklist weights may be set by authorized DIU ACM organizers. Public
            programming data can be delayed, incomplete, or later corrected by
            its source platform. Organizers may correct clear errors to preserve
            a fair result.
          </p>
        </InfoSection>

        <InfoSection icon={KeyRound} title="Accounts and moderation">
          <p>
            Administrators may restrict permissions, remove content, suspend an
            account, or revoke access when reasonably necessary to enforce these
            terms, protect the service, or follow DIU ACM and university rules.
            Serious abuse may be referred to the appropriate university authority.
          </p>
        </InfoSection>

        <InfoSection icon={Handshake} title="Third-party services and availability">
          <p>
            Links and synchronized data from Google, Codeforces, VJudge, AtCoder,
            and other services are provided for convenience. DIU ACM does not
            control their availability, content, or policies.
          </p>
          <p>
            We work to keep this platform reliable, but it is provided as
            available. Features may change, pause, or be withdrawn, and you
            should verify time-sensitive contest information with its original
            source.
          </p>
        </InfoSection>

        <InfoSection icon={ShieldCheck} title="Privacy and updates">
          <p>
            Our <Link to="/privacy">Privacy Policy</Link> explains how the
            platform handles information. We may update these terms as the
            service evolves; the revision date above identifies the current
            version. Questions can be sent through the{' '}
            <Link to="/contact">Contact page</Link>.
          </p>
        </InfoSection>
      </div>
    </div>
  )
}

function ContactCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <span className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-clay-sm">
          <Icon className="size-5" />
        </span>
        <h2 className="text-lg font-semibold">{title}</h2>
        <CardDescription className="leading-6">{description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">{children}</CardContent>
    </Card>
  )
}

export function ContactPage() {
  useDocumentTitle('Contact')

  return (
    <div className="w-full">
      <PageHeader
        title="Contact DIU ACM"
        description="Visit the lab, join our Telegram channel, or contact the right person directly."
      />

      <section className="grid items-start gap-5 lg:grid-cols-2">
        <div className="grid gap-5">
          <Card>
            <CardHeader>
              <span className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-clay-sm">
                <MapPin className="size-5" />
              </span>
              <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                University location
              </p>
              <h2 className="text-2xl font-semibold">Visit the DIU ACM Lab</h2>
              <CardDescription className="leading-6">
                Find the programming lab at Daffodil Smart City.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <address className="rounded-2xl bg-muted/55 p-4 not-italic shadow-clay-inset dark:bg-input/30">
                <span className="flex size-9 items-center justify-center rounded-xl bg-card text-primary shadow-clay-sm">
                  <Building2 className="size-4" />
                </span>
                <p className="mt-4 font-semibold">
                  Daffodil International University
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Daffodil Smart City, Birulia, Savar, Dhaka–1216, Bangladesh
                </p>
              </address>

              <div className="rounded-2xl bg-muted/55 p-4 shadow-clay-inset dark:bg-input/30">
                <span className="flex size-9 items-center justify-center rounded-xl bg-card text-primary shadow-clay-sm">
                  <MapPin className="size-4" />
                </span>
                <p className="mt-4 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  ACM lab room
                </p>
                <p className="mt-1 text-2xl font-bold">KT-310</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Room 310 in Knowledge Tower (KT). Knowledge Tower was formerly
                  known as Academic Building 4 (AB4).
                </p>
              </div>
            </CardContent>
          </Card>

          <ContactCard
            icon={GraduationCap}
            title="Faculty in charge"
            description="Currently in charge of the DIU ACM Lab."
          >
            <div className="mb-4 space-y-1">
              <p className="text-base font-semibold">Mr. Mehadi Hasan</p>
              <p className="text-sm font-medium text-primary">Lecturer</p>
              <p className="text-sm leading-6 text-muted-foreground">
                Department of Computer Science and Engineering
                <br />
                Faculty of Science and Information Technology
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <Button variant="outline" className="w-full" asChild>
                <a href="mailto:mehadihasan.cse@diu.edu.bd">
                  Email Mr. Mehadi Hasan <Mail />
                </a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a
                  href="https://faculty.daffodilvarsity.edu.bd/profile/cse/mehadi.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  View faculty profile <ExternalLink />
                </a>
              </Button>
            </div>
          </ContactCard>
        </div>

        <div className="grid gap-5">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <span className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-primary-foreground/10 text-primary-foreground shadow-clay-sm ring-1 ring-primary-foreground/15">
                <MessageCircle className="size-5" />
              </span>
              <h2 className="text-xl font-semibold">Telegram Channel</h2>
              <CardDescription className="leading-6 text-primary-foreground/75">
                Join the DIU ACM channel for community updates and announcements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full" asChild>
                <a
                  href="https://t.me/+AH0gg2-V5xIxYjA9"
                  target="_blank"
                  rel="noreferrer"
                >
                  Join the Telegram channel <ExternalLink />
                </a>
              </Button>
            </CardContent>
          </Card>

          <ContactCard
            icon={UserRound}
            title="Student representative"
            description="Student Representative of the DIU ACM Lab."
          >
            <p className="mb-4 text-base font-semibold">A. K. M Shohan</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <Button
                variant="outline"
                className="w-full sm:col-span-2 lg:col-span-1"
                asChild
              >
                <Link to="/programmers/shohan241">
                  View DIU ACM profile <UserRound />
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href="mailto:m241-15-862@diu.edu.bd">
                  Email Shohan <Mail />
                </a>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <a href="tel:+8801629775652">
                  01629-775652 <Phone />
                </a>
              </Button>
            </div>
          </ContactCard>
        </div>
      </section>
    </div>
  )
}
