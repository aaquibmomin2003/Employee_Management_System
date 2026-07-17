import prisma from '../config/db';

/**
 * Walks up the manager chain starting from `managerId`.
 * If it ever reaches `employeeId`, assigning that manager would create a cycle.
 */
export const wouldCreateCycle = async (
  employeeId: string,
  managerId: string
): Promise<boolean> => {
  if (employeeId === managerId) return true; // can't manage yourself

  let currentId: string | null = managerId;
  const visited = new Set<string>();

  while (currentId) {
    if (currentId === employeeId) return true; // cycle found
    if (visited.has(currentId)) break; // safety: already-broken data, stop
    visited.add(currentId);

    const current: { managerId: string | null } | null = await prisma.employee.findUnique({
      where: { id: currentId },
      select: { managerId: true },
    });

    currentId = current?.managerId ?? null;
  }

  return false;
};