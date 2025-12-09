import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
) {
    const { filename } = await params;

    // In a real app, you would read from a templates directory
    // const filePath = path.join(process.cwd(), 'templates', filename);

    // For now, return a dummy PDF content
    const dummyContent = `This is a placeholder template for: ${filename}\n\nPlease imagine a real document here.`;

    return new NextResponse(dummyContent, {
        headers: {
            'Content-Type': 'application/pdf', // Pretend it's a PDF
            'Content-Disposition': `attachment; filename="${filename}"`,
        },
    });
}
