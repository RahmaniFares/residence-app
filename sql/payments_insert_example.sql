-- Example insert for dbo.Payments aligned with EF Core PaymentConfiguration
- -- Note: Method and Status are stored as integers corresponding to your enum mappings.
- -- Replace METHOD_VALUE and STATUS_VALUE with actual enum integers (e.g., PaymentMethod.Transfer, PaymentStatus.Pending).

INSERT INTO [dbo].[Payments] (
  [Amount],
  [Method],
  [Status],
  [PeriodStart],
  [PeriodEnd],
  [Notes],
  [ResidenceId],
  [HouseId],
  [ResidentId],
  [CreatedAt],
  [IsDeleted]
)
VALUES (
  1234.56,           -- Amount
  1,                   -- Method (enum value for Transfer, replace as needed)
  0,                   -- Status (enum value for Pending, replace as needed)
  '2026-01-01 00:00:00',
  '2026-01-31 23:59:59',
  'Example payment',
  1,                   -- ResidenceId
  1,                   -- HouseId
  1,                   -- ResidentId
  GETUTCDATE(),        -- CreatedAt
  0                    -- IsDeleted (false)
);
