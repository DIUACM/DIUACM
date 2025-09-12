<?php

use App\Enums\VisibilityStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rank_lists', function (Blueprint $table) {
            $table->enum('status_new', VisibilityStatus::cases())->default('draft');
        });

        // Copy data from old column to new column
        DB::statement('UPDATE rank_lists SET status_new = status');

        Schema::table('rank_lists', function (Blueprint $table) {
            $table->dropColumn('status');
            $table->renameColumn('status_new', 'status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rank_lists', function (Blueprint $table) {
            $table->string('status_old')->default('draft');
        });

        // Copy data from enum column to string column
        DB::statement('UPDATE rank_lists SET status_old = status');

        Schema::table('rank_lists', function (Blueprint $table) {
            $table->dropColumn('status');
            $table->renameColumn('status_old', 'status');
        });
    }
};
