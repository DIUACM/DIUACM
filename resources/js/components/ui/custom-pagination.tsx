import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { router } from '@inertiajs/react';
import { useCallback } from 'react';

type CustomPaginationProps = {
    currentPage: number;
    totalPages: number;
};

export function CustomPagination({ currentPage, totalPages }: CustomPaginationProps) {
    // Handle page navigation without full page reload
    const handlePageChange = useCallback((pageNumber: number) => {
        const url = new URL(window.location.href);
        url.searchParams.set('page', pageNumber.toString());
        router.visit(url.toString(), { preserveState: true, preserveScroll: true });
    }, []);

    // Don't render pagination if there's only one page
    if (totalPages <= 1) {
        return null;
    }

    // Generate page items
    const renderPageItems = () => {
        const items = [];
        const maxVisiblePages = 5;

        // Always show first page
        items.push(
            <PaginationItem key="first">
                <PaginationLink
                    onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(1);
                    }}
                    isActive={currentPage === 1}
                    href="#"
                >
                    1
                </PaginationLink>
            </PaginationItem>,
        );

        // Show ellipsis if needed
        if (currentPage > 3) {
            items.push(
                <PaginationItem key="ellipsis-start">
                    <PaginationEllipsis />
                </PaginationItem>,
            );
        }

        // Calculate range of pages to show
        let startPage = Math.max(2, currentPage - 1);
        let endPage = Math.min(totalPages - 1, currentPage + 1);

        // Adjust range if at beginning or end
        if (currentPage <= 3) {
            endPage = Math.min(totalPages - 1, maxVisiblePages - 1);
        }
        if (currentPage >= totalPages - 2) {
            startPage = Math.max(2, totalPages - (maxVisiblePages - 2));
        }

        // Add middle pages
        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink
                        onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(i);
                        }}
                        isActive={currentPage === i}
                        href="#"
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>,
            );
        }

        // Show ellipsis if needed
        if (currentPage < totalPages - 2) {
            items.push(
                <PaginationItem key="ellipsis-end">
                    <PaginationEllipsis />
                </PaginationItem>,
            );
        }

        // Always show last page if there's more than one page
        if (totalPages > 1) {
            items.push(
                <PaginationItem key="last">
                    <PaginationLink
                        onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(totalPages);
                        }}
                        isActive={currentPage === totalPages}
                        href="#"
                    >
                        {totalPages}
                    </PaginationLink>
                </PaginationItem>,
            );
        }

        return items;
    };

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) {
                                handlePageChange(currentPage - 1);
                            }
                        }}
                        aria-disabled={currentPage === 1}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        tabIndex={currentPage === 1 ? -1 : 0}
                    />
                </PaginationItem>

                {renderPageItems()}

                <PaginationItem>
                    <PaginationNext
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) {
                                handlePageChange(currentPage + 1);
                            }
                        }}
                        aria-disabled={currentPage === totalPages}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        tabIndex={currentPage === totalPages ? -1 : 0}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}