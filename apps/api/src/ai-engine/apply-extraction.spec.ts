import { AuctionType, BrazilianState } from '@prisma/client';
import {
  buildAuctionUpdateFromExtraction,
  mapAuctionType,
  mapState,
  parseFlexibleDate,
} from './apply-extraction';
import type { AuctionExtraction } from '@lancex/shared';

describe('apply-extraction', () => {
  it('parses ISO and BR dates', () => {
    expect(parseFlexibleDate('2026-11-12T10:00:00-03:00')?.getUTCFullYear()).toBe(
      2026,
    );
    const br = parseFlexibleDate('12/11/2026 10:30');
    expect(br?.getFullYear()).toBe(2026);
    expect(br?.getMonth()).toBe(10);
    expect(br?.getDate()).toBe(12);
  });

  it('maps auction type and UF', () => {
    expect(mapAuctionType('público')).toBe(AuctionType.PUBLICO);
    expect(mapAuctionType('judicial')).toBe(AuctionType.JUDICIAL);
    expect(mapState('sp')).toBe(BrazilianState.SP);
    expect(mapState('RJ')).toBe(BrazilianState.RJ);
    expect(mapState('São Paulo')).toBeUndefined();
  });

  it('builds auction update from extraction', () => {
    const extraction = {
      title: 'PRF-SP — Edital veículos 03/11',
      auctionType: 'PUBLICO',
      category: 'veiculos',
      organizer: 'PRF',
      auctioneer: null,
      auctioneerRegistration: null,
      state: 'SP',
      city: 'São Paulo',
      address: null,
      latitude: null,
      longitude: null,
      publicationDate: '2026-10-20',
      startDate: '2026-11-03T10:00:00-03:00',
      endDate: '2026-11-04T10:00:00-03:00',
      appraisalValue: null,
      minimumBid: 40000,
      commissionPercentage: 5,
      lots: [
        {
          lotNumber: '1',
          title: 'Fiat Uno',
          description: null,
          appraisalValue: null,
          minimumBid: 15000,
        },
      ],
      documents: [],
      sourceUrls: [],
      missingInformation: [],
      riskIndicators: [],
      isAuction: true,
      confidence: 0.8,
      evidenceNotes: ['Sessões 03 e 04/11'],
    } satisfies AuctionExtraction;

    const update = buildAuctionUpdateFromExtraction(extraction, {
      title: 'Edital Padrão SLE - Portal Nacional de Contratações Públicas - PNCP',
      description: null,
    });

    expect(update.title).toContain('PRF-SP');
    expect(update.minimumBid).toBe(40000);
    expect(update.auctionType).toBe(AuctionType.PUBLICO);
    expect(update.state).toBe(BrazilianState.SP);
    expect(update.verificationStatus).toBe('EM_ANALISE');
  });
});
