<template>
    <div class="step-2-wrapper">
        <img src="@/views/resources/img/login/connector-pink.png" />
        <span class="text"> {{ $t('please_move_mouse_mnemonic') }}</span>

        <Progress stroke-color="#004f99" :percent="percent" />
    </div>
</template>

<script lang="ts">
import GenerateMnemonicTs from './GenerateMnemonicTs';
export default class GenerateMnemonic extends GenerateMnemonicTs {}
</script>
<style lang="less" scoped>
@import './GenerateMnemonic.less';
</style>
