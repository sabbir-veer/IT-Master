import { NextResponse } from 'next/server';
import { scanDatasets } from '@/lib/dataset-scanner';


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const summaryOnly = searchParams.get('summaryOnly') === 'true';
    const datasetId = searchParams.get('id');

    const result = await scanDatasets();

    if (datasetId) {
      const found = result.datasets.find((d) => d.dataset_id === datasetId);
      if (!found) {
        return NextResponse.json(
          { error: `Dataset with ID '${datasetId}' not found.` },
          { status: 404 }
        );
      }
      return NextResponse.json(found);
    }

    if (summaryOnly) {
      return NextResponse.json({
        summaries: result.summaries,
        subjects: result.subjects,
        totalQuestions: result.totalQuestions,
        invalidFiles: result.invalidFiles,
      });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { error: 'Failed to scan and load datasets', details: message },
      { status: 500 }
    );
  }
}
