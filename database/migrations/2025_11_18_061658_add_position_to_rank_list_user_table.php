<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rank_list_user', function (Blueprint $table) {
            $table->unsignedInteger('position')->nullable()->after('score');
            $table->index(['rank_list_id', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rank_list_user', function (Blueprint $table) {
            $table->dropIndex(['rank_list_id', 'position']);
            $table->dropColumn('position');
        });
    }
};
