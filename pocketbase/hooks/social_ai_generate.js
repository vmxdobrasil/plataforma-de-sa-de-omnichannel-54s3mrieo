routerAdd(
  'POST',
  '/backend/v1/social-ai/generate',
  (e) => {
    const body = e.requestInfo().body
    const topic = body.topic
    const specialty = body.specialty
    const contentType = body.content_type
    const tone = body.tone
    const audience = body.audience || 'general public'

    if (!topic || !specialty || !contentType || !tone) {
      throw new BadRequestError('Missing required fields')
    }

    let generated_text = ''

    if (contentType === 'Instagram Post') {
      generated_text = `🌟 Let's talk about ${topic}!\n\nAs a ${specialty}, I often see patients asking about this, especially among ${audience}. Here are 3 key things you need to know:\n\n1️⃣ Did you know that proper understanding of ${topic} can significantly improve your well-being?\n2️⃣ Many people overlook the early signs. Always pay attention to your body!\n3️⃣ Consistency is key. Make sure to follow professional advice tailored to your needs.\n\nRemember, your health is a priority. Drop your questions below or save this post for later! 👇\n\n#${specialty.replace(/\s+/g, '')} #HealthTips #${topic.replace(/\s+/g, '')} #MedicalAdvice`
    } else if (contentType === 'Reels Script') {
      generated_text = `[Hook] "Did you know this about ${topic}?"\n\n[Intro] "Hi, I'm your friendly neighborhood ${specialty}. Today we're diving into ${topic} for ${audience}."\n\n[Body - Fast paced]\n- "First, it's completely normal to have questions about this."\n- "Second, the best way to manage it is through proactive care."\n- "Third, avoid self-diagnosing and always consult a professional!"\n\n[Call to Action] "Save this video for later and follow for more daily health tips!"`
    } else if (contentType === 'LinkedIn Article') {
      generated_text = `## The Future of ${topic} in ${specialty}\n\nIn my practice as a ${specialty}, navigating the complexities of ${topic} for ${audience} has become increasingly vital. Recent developments show that a proactive approach yields the best patient outcomes.\n\n### The Challenge\nMany patients struggle with understanding the nuances of ${topic}. It's our responsibility as healthcare providers to bridge this educational gap.\n\n### The Solution\nBy maintaining a ${tone.toLowerCase()} dialogue, we can foster better adherence to treatment protocols. Open communication empowers patients to take charge of their health journey.\n\nLet's continue to innovate and provide the highest standard of care.\n\n#HealthcareLeadership #${specialty.replace(/\s+/g, '')} #PatientCare`
    } else {
      generated_text = `**Patient Guide: Understanding ${topic}**\n\n**Audience:** ${audience}\n\n**What is it?**\nAn overview of ${topic} from the perspective of a ${specialty}.\n\n**Why does it matter?**\nIt impacts your daily life and long-term health. Understanding the basics can help you make informed decisions.\n\n**Next Steps:**\n- Follow your prescribed routine diligently.\n- Monitor your symptoms and keep a log if necessary.\n- Contact our office if you have any concerns or notice sudden changes.\n\n*Note: This is an ${tone.toLowerCase()} guide intended for educational purposes and does not replace professional medical advice.*`
    }

    return e.json(200, { generated_text })
  },
  $apis.requireAuth(),
)
