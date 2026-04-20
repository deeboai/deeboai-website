const amadouImage = "/assets/amadou.jpeg";
const kurtImage = "/assets/kurt.jpeg";

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

// Only include people who should appear publicly on the active team page. Former collaborators,
// alumni, or historical contributors should be referenced in narrative copy only when needed.
export const teamMembers: TeamMember[] = [
  {
    id: "amadou-toure",
    name: "Amadou Touré",
    title: "Founder · Chief Executive Officer",
    roleLabel: "Founder & CEO",
    bio:
      "Amadou brings a multidisciplinary background in computer science, data analytics, computer security, and machine learning. He leads DeeboAI's product direction across clinical intelligence, decision support, and applied AI systems built for real operators.",
    expertise: [
      "Applied Machine Learning",
      "Healthcare AI",
      "Data Analytics",
      "Product Strategy",
    ],
    focus: [
      "Translating field research into intuitive software",
      "Designing secure, scalable AI workflows",
      "Building clinical and operational tools that teams will actually adopt",
    ],
    currentRole: "Founder · DeeboAI",
    highlight:
      "Leads collaborations spanning medication intelligence, clinical risk assessment, and custom product development with a focus on trustworthy deployment.",
    quote:
      "“The standard is simple: build AI that fits the workflow, earns trust quickly, and produces something useful on day one.”",
    email: "support@deeboai.com",
    linkedin: "https://www.linkedin.com/in/elhadjiatoure/",
    image: amadouImage,
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
