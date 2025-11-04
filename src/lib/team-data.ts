import amadouImage from "@/assets/amadou.jpeg";
import albertImage from "@/assets/albert.jpeg";
import kurtImage from "@/assets/kurt.jpeg";

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  roleLabel: string;
  bio: string;
  expertise: string[];
  focus: string[];
  currentRole: string;
  highlight: string;
  quote: string;
  email?: string;
  linkedin?: string;
  image: string;
}

export const teamMembers: TeamMember[] = [
  {
    id: "amadou-toure",
    name: "Amadou Touré",
    title: "Co-Founder · Chief Executive Officer",
    roleLabel: "Founder",
    bio:
      "Amadou brings a multidisciplinary background in computer science, data analytics, computer security, and machine learning. With hands-on experience building secure tools and research applications, he aligns DeeboAI's software with the real needs of creatives and operators.",
    expertise: [
      "Applied Machine Learning",
      "Music Technology",
      "Data Analytics",
      "Product Strategy",
    ],
    focus: [
      "Translating field research into intuitive products",
      "Designing secure, scalable AI workflows",
      "Championing artist-first launch strategies",
    ],
    currentRole: "Data Scientist · Baltimore Health Analytics",
    highlight:
      "Spearheaded collaborations that bridge technology with artistry, helping independent musicians adopt AI tooling without sacrificing creative control.",
    quote:
      "“AI should disappear into the background so that the creative feels effortless. When we hit that balance, teams can scale without losing their craft.”",
    email: "etoure33@gmail.com",
    linkedin: "https://www.linkedin.com/in/elhadjiatoure/",
    image: amadouImage,
  },
  {
    id: "albert-osakwe",
    name: "Albert Osakwe",
    title: "Co-Founder · Chief Technology Officer",
    roleLabel: "Founder",
    bio:
      "Albert is a software engineer specializing in artificial intelligence and natural language processing with a track record of delivering durable, high-impact systems.",
    expertise: [
      "AI Architecture & Integration",
      "Infrastructure Automation",
      "Data Engineering",
      "Audio Intelligence",
    ],
    focus: [
      "Designing ML pipelines with measurable outcomes",
      "Operationalizing AI and automation across industries",
      "Mentoring teams on scalable engineering practices",
    ],
    currentRole: "Data Engineer · Meta",
    highlight:
      "Leads the algorithm development and integration efforts that allow DeeboAI to deliver precise, efficient audio editing workflows for mixers and broadcasters.",
    quote:
      "“It's not enough for models to be clever—they have to deliver predictable outcomes, integrate cleanly, and earn the trust of the teams they support.”",
    email: "osakwe05@gmail.com",
    linkedin: "https://www.linkedin.com/in/aaosakwe/",
    image: albertImage,
  },
  {
    id: "kurt-waltenbaugh",
    name: "Kurt Waltenbaugh",
    title: "Board Member & Strategic Advisor",
    roleLabel: "Board Member",
    bio:
      "Kurt is a serial entrepreneur with a career spent building solutions to understand, predict, and influence consumer behavior. He has delivered successful analytic products across healthcare, retail, and education, including ventures acquired by Oracle and Pearson.",
    expertise: [
      "Product Strategy",
      "Healthcare Analytics",
      "Go-to-Market Leadership",
      "Data Platforms",
    ],
    focus: [
      "Mentoring early-stage product and sales strategy",
      "Connecting DeeboAI with healthcare and enterprise partners",
      "Scaling responsible data practices across offerings",
    ],
    currentRole: "Product Strategy Leader · Formerly Optum (UnitedHealth)",
    highlight:
      "Guided DeeboAI through its formative milestones with a focus on customer impact and resilient growth.",
    quote:
      "“Winning teams pair breakthrough tech with a crystal-clear understanding of the customer. DeeboAI keeps that compass, and it shows in the work.”",
    linkedin: "https://www.linkedin.com/in/waltenbaugh/",
    image: kurtImage,
  },
];
